-- ============================================================================
-- 20260804000200  place_order — wholesale (B2B) pricing + order flags
-- ----------------------------------------------------------------------------
-- ⚠ RECONCILE BEFORE RUNNING ⚠
-- This body is derived from the latest place_order in the repo
-- (20260728000100_decant_pool_repair.sql). Per project notes, that decant-repair
-- migration may not be applied to the live DB yet, so the LIVE place_order could
-- differ. Confirm with:
--     SELECT pg_get_functiondef('public.place_order(jsonb)'::regprocedure);
-- If the live body differs from the base below (outside the clearly-marked
-- WHOLESALE blocks), rebase these three edits onto the live body instead of
-- running this file wholesale — it would otherwise also (re)apply the decant
-- changes from 20260728000100.
--
-- The three WHOLESALE edits, and nothing else, are:
--   (A) eligibility + billing lookup, once, before the item loop
--   (B) per-item wholesale price branch (takes precedence over the retail offer)
--   (C) persist is_wholesale_order + billing_* on the order and
--       was_wholesale_price on each order_item
--
-- This mirrors lib/pricing/wholesale.ts exactly — keep the two in lock-step.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.place_order(
  p_payload JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id        UUID := auth.uid();
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
  v_total           NUMERIC(12,2);
  v_notes           TEXT;

  -- ▼▼▼ WHOLESALE (A) ▼▼▼
  v_is_wholesale    BOOLEAN := FALSE;
  v_billing_company TEXT;
  v_billing_tax_id  TEXT;
  v_was_wholesale   BOOLEAN;
  -- ▲▲▲ WHOLESALE (A) ▲▲▲
BEGIN
  -- ════════ 1. Customer block ════════
  v_cust_name  := NULLIF(TRIM(p_payload->'customer'->>'name'),  '');
  v_cust_email := NULLIF(LOWER(TRIM(p_payload->'customer'->>'email')), '');
  v_cust_phone := NULLIF(TRIM(p_payload->'customer'->>'phone'), '');

  IF v_cust_name  IS NULL THEN RAISE EXCEPTION 'customer.name is required';  END IF;
  IF v_cust_phone IS NULL THEN RAISE EXCEPTION 'customer.phone is required'; END IF;
  IF v_cust_email IS NULL OR v_cust_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' THEN
    RAISE EXCEPTION 'customer.email is missing or invalid';
  END IF;

  -- ════════ 2. Shipping block ════════
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

  -- ════════ 3. Items block — structural validation ════════
  v_items_json := p_payload->'items';
  IF v_items_json IS NULL
     OR jsonb_typeof(v_items_json) <> 'array'
     OR jsonb_array_length(v_items_json) = 0 THEN
    RAISE EXCEPTION 'items must be a non-empty array';
  END IF;

  -- ▼▼▼ WHOLESALE (A): is the buyer an APPROVED wholesale account? ▼▼▼
  -- Both gates required (role AND approved application). Guests (v_user_id NULL)
  -- never match. Captures billing snapshot in the same lookup.
  IF v_user_id IS NOT NULL THEN
    SELECT wp.company_name, wp.tax_id
      INTO v_billing_company, v_billing_tax_id
      FROM public.profiles pr
      JOIN public.wholesale_profiles wp ON wp.user_id = pr.id
     WHERE pr.id = v_user_id
       AND pr.role = 'wholesale'
       AND wp.application_status = 'approved';
    v_is_wholesale := FOUND;
  END IF;
  -- ▲▲▲ WHOLESALE (A) ▲▲▲

  -- ════════ 4. Create the order shell ════════
  INSERT INTO public.orders (
    user_id,
    customer_name, customer_email, customer_phone,
    shipping_address, shipping_canton, shipping_district,
    shipping_province, shipping_reference,
    shipping_method, shipping_cost,
    subtotal, tax, discount, total,
    order_status, payment_status,
    source, notes,
    -- ▼ WHOLESALE (C) ▼
    is_wholesale_order, billing_company_name, billing_tax_id
  ) VALUES (
    v_user_id,
    v_cust_name, v_cust_email, v_cust_phone,
    v_ship_address, v_canton_name, v_district,
    v_province_name, v_ship_reference,
    'delivery', 0,
    0, 0, 0, 0,
    'pending', 'pending',
    'web', v_notes,
    -- ▼ WHOLESALE (C): billing_* stay NULL for non-wholesale orders ▼
    v_is_wholesale, v_billing_company, v_billing_tax_id
  )
  RETURNING id, order_number INTO v_order_id, v_order_number;

  -- ════════ 5. Per-item: re-validate from DB, snapshot, decrement inventory ════════
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

    -- Reads pv.product_id (needed to address the decant pool) + wholesale cols.
    SELECT pv.id, pv.product_id, pv.price, pv.offer_price, pv.is_on_offer,
           pv.is_active, pv.stock, pv.product_type, pv.size_ml, pv.sku,
           pv.is_wholesale_enabled, pv.wholesale_price, pv.min_wholesale_quantity,
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

    -- ▼▼▼ WHOLESALE (B): wholesale price first, then retail offer, then list ▼▼▼
    IF v_is_wholesale
       AND v_variant.is_wholesale_enabled
       AND v_variant.wholesale_price IS NOT NULL
       AND v_variant.min_wholesale_quantity IS NOT NULL
       AND v_quantity >= v_variant.min_wholesale_quantity THEN
      v_effective_price := v_variant.wholesale_price;
      v_was_wholesale   := TRUE;
    ELSIF v_variant.is_on_offer AND v_variant.offer_price IS NOT NULL THEN
      v_effective_price := v_variant.offer_price;
      v_was_wholesale   := FALSE;
    ELSE
      v_effective_price := v_variant.price;
      v_was_wholesale   := FALSE;
    END IF;
    -- ▲▲▲ WHOLESALE (B) ▲▲▲

    v_line_total := v_effective_price * v_quantity;
    v_subtotal   := v_subtotal + v_line_total;
    v_item_count := v_item_count + v_quantity;

    INSERT INTO public.order_items (
      order_id, variant_id,
      product_name, brand_name, product_type, size_ml, sku,
      quantity, unit_price, line_total,
      was_wholesale_price   -- ▼ WHOLESALE (C) ▼
    ) VALUES (
      v_order_id, v_variant.id,
      v_variant.product_name, v_variant.brand_name, v_variant.product_type,
      v_variant.size_ml, v_variant.sku,
      v_quantity, v_effective_price, v_line_total,
      v_was_wholesale       -- ▲ WHOLESALE (C) ▲
    );

    -- Decant lines draw from the shared ml pool; every other type uses variant.stock.
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

  -- ════════ 6. Authoritative shipping cost ════════
  v_ship_calc := public.calculate_shipping_cost(v_canton_code, v_subtotal);
  v_ship_cost := (v_ship_calc->>'cost')::NUMERIC(12,2);
  v_total     := v_subtotal + v_ship_cost;

  -- ════════ 7. Finalize totals ════════
  UPDATE public.orders
     SET subtotal      = v_subtotal,
         shipping_cost = v_ship_cost,
         total         = v_total
   WHERE id = v_order_id;

  -- ════════ 8. Clear server cart for authenticated users ════════
  IF v_user_id IS NOT NULL THEN
    DELETE FROM public.cart_items WHERE user_id = v_user_id;
  END IF;

  -- ════════ 9. Return summary ════════
  RETURN jsonb_build_object(
    'order_id',           v_order_id,
    'order_number',       v_order_number,
    'subtotal',           v_subtotal,
    'shipping_cost',      v_ship_cost,
    'total',              v_total,
    'item_count',         v_item_count,
    'is_wholesale_order', v_is_wholesale,   -- ▼ WHOLESALE (C) ▼
    'shipping',           v_ship_calc
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.place_order(JSONB) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.place_order(JSONB) TO anon, authenticated;
