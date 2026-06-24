-- ============================================================================
-- 20260611000200_admin_orders.sql
-- Manual order creation by admins (orders taken via WhatsApp / IG / phone).
--
--   1. place_admin_order(p_payload) — admin sibling of place_order. Same item
--      re-validation + stock decrement + shipping math, but: admin-guarded,
--      user_id is NULL (external customer / guest), created_by_admin_id =
--      the admin, source='admin', email OPTIONAL, supports a manual discount
--      and a pickup option. Always created payment_status='pending'.
--
--   2. mark_order_paid(...) — extended to optionally record a payment
--      reference + note when an admin verifies an offline payment.
--
-- NOTE: the per-item loop intentionally mirrors place_order. The two differ in
-- auth model (auth.uid() user vs admin-on-behalf-of-guest), email requirement,
-- source, discount and shipping method — enough that a shared codepath would be
-- more fragile than a documented sibling. Keep the loops in sync if either
-- changes the order_items snapshot or stock rules.
-- ============================================================================
-- Depends on: place_order_rewrite (calculate_shipping_cost), decrease_variant_stock,
--             admin_order_rpcs (is_admin), orders.created_by_admin_id column.
-- ============================================================================


-- ────────────────────────────────────────────────────────────────────────────
-- 1. place_admin_order(p_payload JSONB) → JSONB
-- ────────────────────────────────────────────────────────────────────────────
-- INPUT:
--   {
--     "customer": { "name", "phone", "email"? },
--     "shipping": { "address", "canton_code", "canton_name", "province_name",
--                   "district"?, "reference"? },
--     "items":    [ { "variant_id", "quantity" }, ... ],
--     "shipping_method": "delivery" | "pickup",   -- default "delivery"
--     "discount": numeric?,                        -- default 0
--     "notes": string?
--   }
-- OUTPUT: { order_id, order_number, subtotal, shipping_cost, discount, total, item_count }

CREATE OR REPLACE FUNCTION public.place_admin_order(
  p_payload JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id       UUID := auth.uid();
  v_order_id       UUID;
  v_order_number   BIGINT;

  v_cust_name      TEXT;
  v_cust_email     TEXT;
  v_cust_phone     TEXT;

  v_ship_address   TEXT;
  v_canton_code    TEXT;
  v_canton_name    TEXT;
  v_province_name  TEXT;
  v_district       TEXT;
  v_ship_reference TEXT;
  v_ship_method    TEXT;

  v_items_json      JSONB;
  v_item            JSONB;
  v_variant_id      UUID;
  v_quantity        INT;
  v_variant         RECORD;
  v_effective_price NUMERIC(12,2);
  v_line_total      NUMERIC(12,2);
  v_subtotal        NUMERIC(12,2) := 0;
  v_item_count      INT := 0;

  v_ship_calc       JSONB;
  v_ship_cost       NUMERIC(12,2);
  v_discount        NUMERIC(12,2);
  v_total           NUMERIC(12,2);
  v_notes           TEXT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Insufficient privilege: admin only.';
  END IF;

  -- ════════ 1. Customer (email OPTIONAL for manual orders) ════════
  v_cust_name  := NULLIF(TRIM(p_payload->'customer'->>'name'),  '');
  v_cust_phone := NULLIF(TRIM(p_payload->'customer'->>'phone'), '');
  v_cust_email := NULLIF(LOWER(TRIM(p_payload->'customer'->>'email')), '');

  IF v_cust_name  IS NULL THEN RAISE EXCEPTION 'customer.name is required';  END IF;
  IF v_cust_phone IS NULL THEN RAISE EXCEPTION 'customer.phone is required'; END IF;
  IF v_cust_email IS NOT NULL
     AND v_cust_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' THEN
    RAISE EXCEPTION 'customer.email is invalid';
  END IF;

  -- ════════ 2. Shipping ════════
  v_ship_method    := COALESCE(NULLIF(TRIM(p_payload->>'shipping_method'), ''), 'delivery');
  IF v_ship_method NOT IN ('delivery', 'pickup') THEN
    RAISE EXCEPTION 'shipping_method must be delivery or pickup';
  END IF;

  v_ship_address   := NULLIF(TRIM(p_payload->'shipping'->>'address'),       '');
  v_canton_code    := NULLIF(TRIM(p_payload->'shipping'->>'canton_code'),   '');
  v_canton_name    := NULLIF(TRIM(p_payload->'shipping'->>'canton_name'),   '');
  v_province_name  := NULLIF(TRIM(p_payload->'shipping'->>'province_name'), '');
  v_district       := NULLIF(TRIM(p_payload->'shipping'->>'district'),      '');
  v_ship_reference := NULLIF(TRIM(p_payload->'shipping'->>'reference'),     '');

  IF v_ship_address  IS NULL THEN RAISE EXCEPTION 'shipping.address (señas) is required'; END IF;
  IF v_canton_code   IS NULL THEN RAISE EXCEPTION 'shipping.canton_code is required';     END IF;
  IF v_canton_name   IS NULL THEN RAISE EXCEPTION 'shipping.canton_name is required';     END IF;
  IF v_province_name IS NULL THEN RAISE EXCEPTION 'shipping.province_name is required';   END IF;

  v_notes := NULLIF(TRIM(p_payload->>'notes'), '');

  -- ════════ 3. Items — structural validation ════════
  v_items_json := p_payload->'items';
  IF v_items_json IS NULL
     OR jsonb_typeof(v_items_json) <> 'array'
     OR jsonb_array_length(v_items_json) = 0 THEN
    RAISE EXCEPTION 'items must be a non-empty array';
  END IF;

  -- ════════ 4. Order shell ════════
  INSERT INTO public.orders (
    user_id, created_by_admin_id,
    customer_name, customer_email, customer_phone,
    shipping_address, shipping_canton, shipping_district,
    shipping_province, shipping_reference,
    shipping_method, shipping_cost,
    subtotal, tax, discount, total,
    order_status, payment_status,
    source, notes
  ) VALUES (
    NULL, v_admin_id,                  -- external customer; created by this admin
    v_cust_name, v_cust_email, v_cust_phone,
    v_ship_address, v_canton_name, v_district,
    v_province_name, v_ship_reference,
    v_ship_method, 0,
    0, 0, 0, 0,
    'pending', 'pending',              -- NEVER auto-paid (business rule)
    'admin', v_notes
  )
  RETURNING id, order_number INTO v_order_id, v_order_number;

  -- ════════ 5. Per-item: re-validate from DB, snapshot, decrement stock ════════
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_items_json)
  LOOP
    v_variant_id := (v_item->>'variant_id')::UUID;
    v_quantity   := (v_item->>'quantity')::INT;

    IF v_variant_id IS NULL THEN
      RAISE EXCEPTION 'items[].variant_id is required';
    END IF;
    IF v_quantity IS NULL OR v_quantity <= 0 THEN
      RAISE EXCEPTION 'items[].quantity must be a positive integer';
    END IF;

    SELECT pv.id, pv.product_id, pv.price, pv.offer_price, pv.is_on_offer,
           pv.is_active, pv.stock, pv.product_type, pv.size_ml, pv.sku,
           p.name AS product_name, b.name AS brand_name
      INTO v_variant
      FROM public.product_variants pv
      JOIN public.products p ON p.id = pv.product_id
      JOIN public.brands   b ON b.id = p.brand_id
     WHERE pv.id = v_variant_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Variant % no longer exists.', v_variant_id;
    END IF;
    IF NOT v_variant.is_active THEN
      RAISE EXCEPTION 'Variant % (%) is no longer available for sale.',
        v_variant.sku, v_variant.product_name;
    END IF;

    IF v_variant.is_on_offer AND v_variant.offer_price IS NOT NULL THEN
      v_effective_price := v_variant.offer_price;
    ELSE
      v_effective_price := v_variant.price;
    END IF;

    v_line_total := v_effective_price * v_quantity;
    v_subtotal   := v_subtotal + v_line_total;
    v_item_count := v_item_count + v_quantity;

    INSERT INTO public.order_items (
      order_id, variant_id,
      product_name, brand_name, product_type, size_ml, sku,
      quantity, unit_price, line_total
    ) VALUES (
      v_order_id, v_variant.id,
      v_variant.product_name, v_variant.brand_name, v_variant.product_type,
      v_variant.size_ml, v_variant.sku,
      v_quantity, v_effective_price, v_line_total
    );

    -- Same inventory rules as the website's place_order: decant lines draw
    -- from the shared ml pool; all other types decrement variant.stock. Both
    -- lock + raise on insufficiency → the whole txn rolls back.
    IF v_variant.product_type = 'decant' THEN
      PERFORM public.decrease_decant_pool(
        v_variant.product_id,
        v_variant.size_ml * v_quantity,
        v_order_id
      );
    ELSE
      PERFORM public.decrease_variant_stock(v_variant.id, v_quantity, v_order_id);
    END IF;
  END LOOP;

  -- ════════ 6. Shipping cost (pickup = free) ════════
  IF v_ship_method = 'pickup' THEN
    v_ship_cost := 0;
    v_ship_calc := jsonb_build_object('cost', 0, 'pickup', true);
  ELSE
    v_ship_calc := public.calculate_shipping_cost(v_canton_code, v_subtotal);
    v_ship_cost := (v_ship_calc->>'cost')::NUMERIC(12,2);
  END IF;

  -- ════════ 7. Discount (clamped to a sane range) ════════
  v_discount := COALESCE((p_payload->>'discount')::NUMERIC(12,2), 0);
  IF v_discount < 0 THEN
    RAISE EXCEPTION 'discount cannot be negative';
  END IF;
  IF v_discount > v_subtotal + v_ship_cost THEN
    RAISE EXCEPTION 'discount cannot exceed the order total';
  END IF;

  v_total := v_subtotal + v_ship_cost - v_discount;

  -- ════════ 8. Finalize totals ════════
  UPDATE public.orders
     SET subtotal      = v_subtotal,
         shipping_cost = v_ship_cost,
         discount      = v_discount,
         total         = v_total
   WHERE id = v_order_id;

  -- ════════ 9. Return summary ════════
  RETURN jsonb_build_object(
    'order_id',      v_order_id,
    'order_number',  v_order_number,
    'subtotal',      v_subtotal,
    'shipping_cost', v_ship_cost,
    'discount',      v_discount,
    'total',         v_total,
    'item_count',    v_item_count,
    'shipping',      v_ship_calc
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.place_admin_order(JSONB) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.place_admin_order(JSONB) TO authenticated, service_role;


-- ────────────────────────────────────────────────────────────────────────────
-- 2. mark_order_paid(p_order_id, p_reference?, p_note?)
-- ────────────────────────────────────────────────────────────────────────────
-- Extended so an admin verifying an offline payment can record the SINPE/transfer
-- reference and an optional note. Backward compatible: the 1-arg call still works
-- (both extra params default NULL). Same strict guards as before.

DROP FUNCTION IF EXISTS public.mark_order_paid(UUID);

CREATE OR REPLACE FUNCTION public.mark_order_paid(
  p_order_id  UUID,
  p_reference TEXT DEFAULT NULL,
  p_note      TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order     RECORD;
  v_reference TEXT := NULLIF(TRIM(p_reference), '');
  v_note      TEXT := NULLIF(TRIM(p_note), '');
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Insufficient privilege: admin only.';
  END IF;

  IF p_order_id IS NULL THEN
    RAISE EXCEPTION 'order_id is required';
  END IF;

  SELECT id, order_status, payment_status, payment_provider, notes INTO v_order
    FROM public.orders
   WHERE id = p_order_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order % does not exist.', p_order_id;
  END IF;

  IF v_order.payment_status <> 'pending' THEN
    RAISE EXCEPTION 'Order is in payment_status=%; cannot mark as paid.', v_order.payment_status;
  END IF;
  IF v_order.order_status <> 'pending' THEN
    RAISE EXCEPTION 'Order is in order_status=%; cannot mark as paid.', v_order.order_status;
  END IF;

  UPDATE public.orders
     SET payment_status   = 'paid',
         paid_at          = now(),
         payment_provider = COALESCE(payment_provider, 'manual'),
         payment_reference = COALESCE(v_reference, payment_reference),
         notes = CASE
                   WHEN v_note IS NULL THEN notes
                   ELSE COALESCE(notes || E'\n', '') || 'Pago verificado: ' || v_note
                 END
   WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'order_id',          p_order_id,
    'previous_provider', v_order.payment_provider,
    'reference',         v_reference,
    'marked_paid_at',    now()
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.mark_order_paid(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.mark_order_paid(UUID, TEXT, TEXT) TO authenticated, service_role;


-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- 1. Functions exist:
--    SELECT proname, pg_get_function_arguments(oid)
--      FROM pg_proc WHERE proname IN ('place_admin_order','mark_order_paid');
--
-- 2. Non-admin rejected:
--    SELECT public.place_admin_order('{}'::jsonb);  -- as a normal user → Insufficient privilege
--
-- 3. Happy path (admin session / service_role in Studio) — use a REAL active variant:
--    SELECT public.place_admin_order('{
--      "customer": {"name":"Cliente WhatsApp","phone":"88880000"},
--      "shipping": {"address":"200m sur","canton_code":"101","canton_name":"San José","province_name":"San José"},
--      "items": [{"variant_id":"<real-variant-uuid>","quantity":1}],
--      "shipping_method":"delivery"
--    }'::jsonb);
--    → order created with source='admin', payment_status='pending', user_id NULL,
--      created_by_admin_id = you; stock decremented; order_items snapshot written.
-- ============================================================================
