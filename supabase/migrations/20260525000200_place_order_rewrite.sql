-- ============================================================================
-- 20260525000200_place_order_rewrite.sql
-- Replace broken place_order with guest+Onvo-aware atomic checkout RPC.
-- Add calculate_shipping_cost helper (also used by checkout page preview).
-- Remove the public INSERT policy on orders so all order creation must
-- funnel through the SECURITY DEFINER RPC.
-- ============================================================================
-- Depends on: 20260525000100_checkout_foundation.sql (shipping_zones,
--             shipping_zone_cantons), existing decrease_variant_stock RPC.
-- ============================================================================


-- ────────────────────────────────────────────────────────────────────────────
-- 1. DROP BROKEN ARTIFACTS
-- ────────────────────────────────────────────────────────────────────────────

-- The old RPC references columns that no longer exist (status → order_status)
-- and is missing fields required by the live schema (customer_*, shipping_canton, etc.)
DROP FUNCTION IF EXISTS public.place_order(UUID);
DROP FUNCTION IF EXISTS public.place_order(JSONB);  -- safety for re-runs

-- This policy let the anon/authenticated roles INSERT orders directly, bypassing
-- server-side validation. After this migration, only SECURITY DEFINER functions
-- (place_order) can create orders.
DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;


-- ────────────────────────────────────────────────────────────────────────────
-- 2. calculate_shipping_cost(canton_code, subtotal) → JSONB
-- ────────────────────────────────────────────────────────────────────────────
-- Pure lookup: given a CR canton code and a cart subtotal, returns:
--   { cost, zone_code, zone_name, free_shipping_applied, free_shipping_threshold }
--
-- Algorithm:
--   1. Find the zone for the canton in shipping_zone_cantons.
--   2. If the canton is not mapped (non-GAM canton in our seed), fall back to
--      the zone with code='rural'.
--   3. If subtotal >= free_shipping_threshold (and threshold is not NULL),
--      cost is 0; otherwise cost is base_cost.
--
-- Callable by:
--   - place_order() — the authoritative use
--   - the /checkout page client-side — for live preview as user picks canton
--
-- SECURITY INVOKER (default) — both tables have public SELECT policies, so
-- anon/authenticated can read them. No need for elevated privileges here.

CREATE OR REPLACE FUNCTION public.calculate_shipping_cost(
  p_canton_code TEXT,
  p_subtotal    NUMERIC
) RETURNS JSONB
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_zone RECORD;
  v_cost NUMERIC;
  v_free BOOLEAN;
BEGIN
  IF p_canton_code IS NULL THEN
    RAISE EXCEPTION 'canton_code is required';
  END IF;
  IF p_subtotal IS NULL OR p_subtotal < 0 THEN
    RAISE EXCEPTION 'subtotal must be a non-negative number';
  END IF;

  -- Resolve canton → zone via the mapping table.
  SELECT z.id, z.code, z.name, z.base_cost, z.free_shipping_threshold
    INTO v_zone
    FROM public.shipping_zones z
    JOIN public.shipping_zone_cantons szc ON szc.zone_id = z.id
   WHERE szc.canton_code = p_canton_code
     AND z.is_active = TRUE;

  -- Fallback: canton not mapped → rural zone.
  IF NOT FOUND THEN
    SELECT id, code, name, base_cost, free_shipping_threshold
      INTO v_zone
      FROM public.shipping_zones
     WHERE code = 'rural' AND is_active = TRUE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'No active rural shipping zone configured. Seed it via Migration 0001.';
    END IF;
  END IF;

  -- Apply free-shipping threshold if defined.
  IF v_zone.free_shipping_threshold IS NOT NULL
     AND p_subtotal >= v_zone.free_shipping_threshold THEN
    v_cost := 0;
    v_free := TRUE;
  ELSE
    v_cost := v_zone.base_cost;
    v_free := FALSE;
  END IF;

  RETURN jsonb_build_object(
    'cost',                    v_cost,
    'zone_code',               v_zone.code,
    'zone_name',               v_zone.name,
    'free_shipping_applied',   v_free,
    'free_shipping_threshold', v_zone.free_shipping_threshold
  );
END;
$$;

-- Explicit grants (default is GRANT TO PUBLIC; being explicit for clarity).
REVOKE EXECUTE ON FUNCTION public.calculate_shipping_cost(TEXT, NUMERIC) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.calculate_shipping_cost(TEXT, NUMERIC) TO anon, authenticated;


-- ────────────────────────────────────────────────────────────────────────────
-- 3. place_order(p_payload JSONB) → JSONB
-- ────────────────────────────────────────────────────────────────────────────
-- The atomic checkout transaction.
--
-- INPUT — p_payload:
--   {
--     "customer":  { "name", "email", "phone" },
--     "shipping":  {
--       "address",        -- free-text señas, e.g. "200m sur de la iglesia"
--       "canton_code",    -- e.g. "101"  (drives shipping cost lookup)
--       "canton_name",    -- e.g. "San José"  (display-only snapshot)
--       "province_name",  -- e.g. "San José"  (display-only snapshot)
--       "district",       -- optional, e.g. "Carmen"
--       "reference"       -- optional, secondary landmark
--     },
--     "items":     [ { "variant_id", "quantity" }, ... ],
--     "notes":     "optional gift message / special request"
--   }
--
-- OUTPUT — JSONB:
--   {
--     "order_id":      uuid,
--     "order_number":  bigint,
--     "subtotal":      numeric,
--     "shipping_cost": numeric,
--     "total":         numeric,
--     "item_count":    int,
--     "shipping":      { cost, zone_code, zone_name, free_shipping_applied, free_shipping_threshold }
--   }
--
-- BEHAVIOR:
--   - Works for both authenticated users (auth.uid() ≠ NULL) and guests (NULL).
--   - Re-loads every variant from DB; client-sent prices/stock are ignored.
--   - Uses decrease_variant_stock's row lock — safe under concurrency.
--   - Wraps everything in one transaction; any error rolls back fully.
--   - Clears cart_items only if user is authenticated.
--
-- SECURITY DEFINER because it bypasses the now-blocked public INSERT on orders.

CREATE OR REPLACE FUNCTION public.place_order(
  p_payload JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id        UUID := auth.uid();  -- NULL for guests
  v_order_id       UUID;
  v_order_number   BIGINT;

  -- Customer fields
  v_cust_name      TEXT;
  v_cust_email     TEXT;
  v_cust_phone     TEXT;

  -- Shipping fields
  v_ship_address   TEXT;
  v_canton_code    TEXT;
  v_canton_name    TEXT;
  v_province_name  TEXT;
  v_district       TEXT;
  v_ship_reference TEXT;

  -- Items processing
  v_items_json      JSONB;
  v_item            JSONB;
  v_variant_id      UUID;
  v_quantity        INT;
  v_variant         RECORD;
  v_effective_price NUMERIC(12,2);
  v_line_total      NUMERIC(12,2);
  v_subtotal        NUMERIC(12,2) := 0;
  v_item_count      INT := 0;

  -- Shipping calculation
  v_ship_calc       JSONB;
  v_ship_cost       NUMERIC(12,2);

  -- Totals
  v_total           NUMERIC(12,2);

  -- Other
  v_notes           TEXT;
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

  -- ════════ 4. Create the order shell (totals filled in below) ════════
  INSERT INTO public.orders (
    user_id,
    customer_name, customer_email, customer_phone,
    shipping_address, shipping_canton, shipping_district,
    shipping_province, shipping_reference,
    shipping_method, shipping_cost,
    subtotal, tax, discount, total,
    order_status, payment_status,
    source, notes
  ) VALUES (
    v_user_id,
    v_cust_name, v_cust_email, v_cust_phone,
    v_ship_address, v_canton_name, v_district,
    v_province_name, v_ship_reference,
    'delivery', 0,             -- shipping_cost placeholder; updated in step 6
    0, 0, 0, 0,                -- subtotal/tax/discount/total placeholders
    'pending', 'pending',
    'web', v_notes
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

    -- Authoritative lookup. Stock value here is read-only; the FOR UPDATE
    -- lock happens inside decrease_variant_stock below.
    SELECT pv.id, pv.price, pv.offer_price, pv.is_on_offer,
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

    -- Effective price (offer takes precedence if active and set).
    IF v_variant.is_on_offer AND v_variant.offer_price IS NOT NULL THEN
      v_effective_price := v_variant.offer_price;
    ELSE
      v_effective_price := v_variant.price;
    END IF;

    v_line_total := v_effective_price * v_quantity;
    v_subtotal   := v_subtotal + v_line_total;
    v_item_count := v_item_count + v_quantity;

    -- Snapshot the line (immutable copy — survives variant edits/deletes).
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

    -- Lock+decrement stock. Raises if insufficient → entire txn rolls back.
    PERFORM public.decrease_variant_stock(v_variant.id, v_quantity, v_order_id);
  END LOOP;

  -- ════════ 6. Compute authoritative shipping cost ════════
  v_ship_calc := public.calculate_shipping_cost(v_canton_code, v_subtotal);
  v_ship_cost := (v_ship_calc->>'cost')::NUMERIC(12,2);

  v_total := v_subtotal + v_ship_cost;

  -- ════════ 7. Finalize order totals ════════
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
    'order_id',      v_order_id,
    'order_number',  v_order_number,
    'subtotal',      v_subtotal,
    'shipping_cost', v_ship_cost,
    'total',         v_total,
    'item_count',    v_item_count,
    'shipping',      v_ship_calc
  );
END;
$$;

-- Explicit grants — both anon (guests) and authenticated (logged-in) call this.
REVOKE EXECUTE ON FUNCTION public.place_order(JSONB) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.place_order(JSONB) TO anon, authenticated;


-- ============================================================================
-- VERIFICATION QUERIES — run after the migration
-- ============================================================================
-- 1. Both functions exist with the expected signatures:
--    SELECT proname, pg_get_function_arguments(oid) AS args,
--           pg_get_function_result(oid) AS returns
--      FROM pg_proc
--     WHERE proname IN ('place_order', 'calculate_shipping_cost')
--     ORDER BY proname;
--
--    → calculate_shipping_cost(p_canton_code text, p_subtotal numeric) → jsonb
--    → place_order(p_payload jsonb)                                    → jsonb
--
-- 2. Old single-arg place_order is gone:
--    SELECT COUNT(*) FROM pg_proc
--     WHERE proname='place_order'
--       AND pg_get_function_arguments(oid) = 'p_address_id uuid';
--    → expect 0
--
-- 3. INSERT policy on orders is removed:
--    SELECT policyname FROM pg_policies
--     WHERE schemaname='public' AND tablename='orders' AND cmd='INSERT';
--    → expect 0 rows
--
-- 4. Shipping cost smoke tests:
--    SELECT public.calculate_shipping_cost('101', 10000);   -- GAM, under threshold
--      → cost=2500, zone_code='gam', free_shipping_applied=false
--    SELECT public.calculate_shipping_cost('101', 40000);   -- GAM, over threshold
--      → cost=0, free_shipping_applied=true
--    SELECT public.calculate_shipping_cost('701', 10000);   -- Limón (unmapped → rural)
--      → cost=4500, zone_code='rural', free_shipping_applied=false
--    SELECT public.calculate_shipping_cost('701', 60000);   -- Rural, over threshold
--      → cost=0, free_shipping_applied=true
--
-- 5. place_order DRY check — DON'T actually run unless you want a real order.
--    Use a non-real variant_id to verify it raises cleanly:
--    SELECT public.place_order('{
--      "customer": {"name":"Test","email":"t@t.com","phone":"00000000"},
--      "shipping": {"address":"x","canton_code":"101","canton_name":"San José","province_name":"San José"},
--      "items": [{"variant_id":"00000000-0000-0000-0000-000000000000","quantity":1}]
--    }'::jsonb);
--    → expect: ERROR 'Variant 00000000-... no longer exists.'
-- ============================================================================
