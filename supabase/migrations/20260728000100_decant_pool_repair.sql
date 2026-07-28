-- ============================================================================
-- 20260728000100_decant_pool_repair.sql
-- IDEMPOTENT repair: guarantee the shared decant ml-pool workflow is actually
-- installed on the live database.
--
-- WHY THIS EXISTS
--   Migrations 20260609000100 (place_order decant branch + decrease_decant_pool)
--   and 20260609000200 (increase_decant_pool + restore branch) define the correct
--   logic, but the live DB was still running the pre-pool place_order: decant
--   checkout hit decrease_variant_stock (variant.stock is pinned at 0 for decants)
--   and failed with "Insufficient stock" even when the pool had plenty of liquid.
--
--   Those two migrations are NOT safely re-runnable (bare ADD CONSTRAINT on
--   uq_variant_product_id / chk_movement_target / chk_decant_zero_stock throws if
--   a prior partial apply already created them). This migration reinstalls the
--   whole workflow with every DDL step guarded, so it is safe to paste into the
--   Supabase SQL editor regardless of whether the 0609 pair applied fully,
--   partially, or not at all.
--
-- WHAT IT DOES  (function bodies are byte-for-byte the canonical 0609 versions —
--   no behavioural change, this is a deployment fix, not a logic change):
--   * ensures the enum values, dual-mode stock_movements columns, and the three
--     integrity constraints exist (guarded);
--   * (re)creates decrease_decant_pool / increase_decant_pool;
--   * (re)creates place_order  with the decant → pool branch (THE actual fix);
--   * (re)creates restore_variant_stock with the decant → pool refund branch.
-- ============================================================================
-- Depends on: 20260525000200 (calculate_shipping_cost, orders/order_items),
--             20260525000600 (decrease_variant_stock + app.skip_stock_audit),
--             products.decant_stock_ml + decant_transformations (applied earlier).
-- ============================================================================


-- ════════════════════════════════════════════════════════════════════════════
-- STEP 0 — Enum values (idempotent no-ops if already present)
-- ────────────────────────────────────────────────────────────────────────────
-- Safe to run inline: ADD VALUE IF NOT EXISTS only errors if the value is BRAND
-- NEW *and* used in the same txn. These already exist on the live DB, so both are
-- no-ops. (On a truly fresh DB, run STEP 0 alone first and let it COMMIT.)
ALTER TYPE public.product_type          ADD VALUE IF NOT EXISTS 'set';
ALTER TYPE public.stock_movement_reason ADD VALUE IF NOT EXISTS 'transformed_to_decant';


-- ════════════════════════════════════════════════════════════════════════════
-- STEP 1 — stock_movements becomes dual-mode (variant-level OR pool-level)
-- ════════════════════════════════════════════════════════════════════════════
-- The pool is numeric ml on products; it can't be expressed with variant_id +
-- integer stock columns. Make the variant columns nullable and add a parallel
-- pool block. All steps are individually idempotent.
ALTER TABLE public.stock_movements
  ALTER COLUMN variant_id     DROP NOT NULL,
  ALTER COLUMN previous_stock DROP NOT NULL,
  ALTER COLUMN new_stock      DROP NOT NULL,
  ALTER COLUMN delta          DROP NOT NULL;

ALTER TABLE public.stock_movements
  ADD COLUMN IF NOT EXISTS product_id   UUID REFERENCES public.products(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS previous_ml  NUMERIC,
  ADD COLUMN IF NOT EXISTS new_ml       NUMERIC,
  ADD COLUMN IF NOT EXISTS ml_delta     NUMERIC;

CREATE INDEX IF NOT EXISTS idx_movements_product_id
  ON public.stock_movements (product_id) WHERE product_id IS NOT NULL;

-- Exactly one of {variant block, pool block} must be fully populated per row.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'chk_movement_target'
       AND conrelid = 'public.stock_movements'::regclass
  ) THEN
    ALTER TABLE public.stock_movements
      ADD CONSTRAINT chk_movement_target CHECK (
        (   variant_id     IS NOT NULL
        AND product_id     IS NULL
        AND previous_stock IS NOT NULL AND new_stock IS NOT NULL AND delta IS NOT NULL
        AND previous_ml    IS NULL     AND new_ml    IS NULL     AND ml_delta IS NULL )
        OR
        (   product_id     IS NOT NULL
        AND variant_id     IS NULL
        AND previous_ml    IS NOT NULL AND new_ml    IS NOT NULL AND ml_delta IS NOT NULL
        AND previous_stock IS NULL     AND new_stock IS NULL     AND delta    IS NULL )
      );
  END IF;
END $$;


-- ════════════════════════════════════════════════════════════════════════════
-- STEP 2 — Referential integrity: a variant belongs to exactly one product
-- ════════════════════════════════════════════════════════════════════════════
-- UNIQUE (product_id, id) is the composite-FK target used by product_images /
-- decant_transformations. Guarded so a prior apply doesn't abort the re-run.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'uq_variant_product_id'
       AND conrelid = 'public.product_variants'::regclass
  ) THEN
    ALTER TABLE public.product_variants
      ADD CONSTRAINT uq_variant_product_id UNIQUE (product_id, id);
  END IF;
END $$;


-- ════════════════════════════════════════════════════════════════════════════
-- STEP 3 — Decant variants carry no manual stock (the pool is the truth)
-- ════════════════════════════════════════════════════════════════════════════
-- Zero any stray decant stock (always meaningless under the pool model), then
-- forbid it going forward. Cancel/restore logic reads variant.stock=0 for decants.
UPDATE public.product_variants
   SET stock = 0
 WHERE product_type = 'decant' AND stock <> 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'chk_decant_zero_stock'
       AND conrelid = 'public.product_variants'::regclass
  ) THEN
    ALTER TABLE public.product_variants
      ADD CONSTRAINT chk_decant_zero_stock
      CHECK (product_type <> 'decant' OR stock = 0);
  END IF;
END $$;


-- ════════════════════════════════════════════════════════════════════════════
-- STEP 4 — decrease_decant_pool(product, ml, order): atomic pool depletion
-- ════════════════════════════════════════════════════════════════════════════
-- Locks the PRODUCT row so concurrent decant orders drawing from the same pool
-- (any/different sizes) can't oversell. Logs a pool-level stock_movement.
CREATE OR REPLACE FUNCTION public.decrease_decant_pool(
  p_product_id UUID,
  p_ml         NUMERIC,
  p_order_id   UUID
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current NUMERIC;
BEGIN
  IF p_ml IS NULL OR p_ml <= 0 THEN
    RAISE EXCEPTION 'Decant ml to consume must be positive (got %).', p_ml;
  END IF;

  SELECT decant_stock_ml INTO v_current
    FROM public.products
   WHERE id = p_product_id
     FOR UPDATE;

  IF v_current IS NULL THEN
    RAISE EXCEPTION 'Product % does not exist.', p_product_id;
  END IF;

  IF v_current < p_ml THEN
    RAISE EXCEPTION 'Insufficient decant liquid for product %. Available: % ml, requested: % ml.',
      p_product_id, v_current, p_ml;
  END IF;

  UPDATE public.products
     SET decant_stock_ml = decant_stock_ml - p_ml
   WHERE id = p_product_id;

  INSERT INTO public.stock_movements (
    product_id, previous_ml, new_ml, ml_delta, reason, reference_id, performed_by
  ) VALUES (
    p_product_id, v_current, v_current - p_ml, -p_ml, 'order_placed', p_order_id, auth.uid()
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.decrease_decant_pool(UUID, NUMERIC, UUID) FROM PUBLIC;


-- ════════════════════════════════════════════════════════════════════════════
-- STEP 5 — increase_decant_pool(product, ml, order, reason): atomic pool refund
-- ════════════════════════════════════════════════════════════════════════════
-- Mirror of decrease_decant_pool. Reason supplied by caller so it serves both
-- cancellations ('order_cancelled') and returns ('return').
CREATE OR REPLACE FUNCTION public.increase_decant_pool(
  p_product_id UUID,
  p_ml         NUMERIC,
  p_order_id   UUID,
  p_reason     stock_movement_reason
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current NUMERIC;
BEGIN
  IF p_ml IS NULL OR p_ml <= 0 THEN
    RAISE EXCEPTION 'Decant ml to refund must be positive (got %).', p_ml;
  END IF;

  IF p_reason NOT IN ('order_cancelled', 'return') THEN
    RAISE EXCEPTION 'increase_decant_pool reason must be order_cancelled or return (got %).', p_reason;
  END IF;

  SELECT decant_stock_ml INTO v_current
    FROM public.products
   WHERE id = p_product_id
     FOR UPDATE;

  IF v_current IS NULL THEN
    RAISE EXCEPTION 'Product % does not exist.', p_product_id;
  END IF;

  UPDATE public.products
     SET decant_stock_ml = decant_stock_ml + p_ml
   WHERE id = p_product_id;

  INSERT INTO public.stock_movements (
    product_id, previous_ml, new_ml, ml_delta, reason, reference_id, performed_by
  ) VALUES (
    p_product_id, v_current, v_current + p_ml, p_ml, p_reason, p_order_id, auth.uid()
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.increase_decant_pool(UUID, NUMERIC, UUID, stock_movement_reason) FROM PUBLIC;


-- ════════════════════════════════════════════════════════════════════════════
-- STEP 6 — place_order: branch decant lines to the pool (THE FIX)
-- ════════════════════════════════════════════════════════════════════════════
-- Identical to 20260609000100 STEP 7. Only decant lines change vs the pre-pool
-- version: they call decrease_decant_pool() instead of decrease_variant_stock().
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

  -- ════════ 4. Create the order shell ════════
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
    'delivery', 0,
    0, 0, 0, 0,
    'pending', 'pending',
    'web', v_notes
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

    -- Reads pv.product_id (needed to address the decant pool).
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

REVOKE EXECUTE ON FUNCTION public.place_order(JSONB) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.place_order(JSONB) TO anon, authenticated;


-- ════════════════════════════════════════════════════════════════════════════
-- STEP 7 — restore_variant_stock: refund decant lines to the pool
-- ════════════════════════════════════════════════════════════════════════════
-- Identical to 20260609000200 STEP 2. Decant lines refund size_ml*quantity to the
-- pool via increase_decant_pool and NEVER touch variant.stock (pinned at 0). All
-- other types keep the exact variant-stock path. Idempotency guard covers both
-- kinds (same reference_id + order_cancelled/return reason).
CREATE OR REPLACE FUNCTION public.restore_variant_stock(
  p_order_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id         UUID;
  v_already_restored BOOLEAN;
  v_item             RECORD;
  v_current_stock    INT;
  v_product_id       UUID;
  v_restored_count   INT := 0;
  v_skipped_count    INT := 0;
BEGIN
  PERFORM set_config('app.skip_stock_audit', '1', true);

  IF p_order_id IS NULL THEN
    RAISE EXCEPTION 'order_id is required';
  END IF;

  IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Insufficient privilege to restore stock for order %.', p_order_id;
  END IF;

  SELECT id INTO v_order_id
    FROM public.orders
   WHERE id = p_order_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order % does not exist.', p_order_id;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.stock_movements
     WHERE reference_id = p_order_id
       AND reason IN ('order_cancelled', 'return')
  ) INTO v_already_restored;

  IF v_already_restored THEN
    RETURN jsonb_build_object(
      'order_id',       p_order_id,
      'restored',       false,
      'reason',         'already_restored',
      'items_restored', 0,
      'items_skipped',  0
    );
  END IF;

  FOR v_item IN
    SELECT variant_id, quantity, sku, product_name, product_type, size_ml
      FROM public.order_items
     WHERE order_id = p_order_id
  LOOP
    -- Decant lines: refund liquid to the shared pool, never to variant.stock.
    IF v_item.product_type = 'decant' THEN
      IF v_item.variant_id IS NULL
         OR v_item.size_ml IS NULL OR v_item.size_ml <= 0 THEN
        v_skipped_count := v_skipped_count + 1;
        CONTINUE;
      END IF;

      SELECT product_id INTO v_product_id
        FROM public.product_variants
       WHERE id = v_item.variant_id;

      IF NOT FOUND THEN
        v_skipped_count := v_skipped_count + 1;
        CONTINUE;
      END IF;

      PERFORM public.increase_decant_pool(
        v_product_id,
        v_item.size_ml * v_item.quantity,
        p_order_id,
        'order_cancelled'
      );

      v_restored_count := v_restored_count + 1;
      CONTINUE;
    END IF;

    -- Non-decant lines: restore variant.stock exactly as before.
    IF v_item.variant_id IS NULL THEN
      v_skipped_count := v_skipped_count + 1;
      CONTINUE;
    END IF;

    SELECT stock INTO v_current_stock
      FROM public.product_variants
     WHERE id = v_item.variant_id
       FOR UPDATE;

    IF NOT FOUND THEN
      v_skipped_count := v_skipped_count + 1;
      CONTINUE;
    END IF;

    UPDATE public.product_variants
       SET stock = stock + v_item.quantity
     WHERE id = v_item.variant_id;

    INSERT INTO public.stock_movements (
      variant_id, previous_stock, new_stock, delta, reason, reference_id, performed_by
    ) VALUES (
      v_item.variant_id,
      v_current_stock,
      v_current_stock + v_item.quantity,
      v_item.quantity,
      'order_cancelled',
      p_order_id,
      auth.uid()
    );

    v_restored_count := v_restored_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'order_id',       p_order_id,
    'restored',       true,
    'reason',         NULL,
    'items_restored', v_restored_count,
    'items_skipped',  v_skipped_count
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.restore_variant_stock(UUID) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.restore_variant_stock(UUID) TO authenticated, service_role;


-- ============================================================================
-- VERIFICATION — run after applying (Supabase SQL editor)
-- ============================================================================
-- 1. place_order now branches to the pool (this is the core fix):
--    SELECT pg_get_functiondef('public.place_order(jsonb)'::regprocedure)
--             LIKE '%decrease_decant_pool%' AS is_fixed;          -- → true
--
-- 2. Pool + refund helpers exist:
--    SELECT proname FROM pg_proc
--     WHERE proname IN ('decrease_decant_pool','increase_decant_pool');  -- → 2 rows
--
-- 3. No decant variant carries manual stock:
--    SELECT COUNT(*) FROM product_variants WHERE product_type='decant' AND stock<>0;  -- → 0
--
-- 4. Live round-trip (replace <decant_variant> with a real decant variant id):
--    -- note products.decant_stock_ml for its parent BEFORE
--    SELECT public.place_order('{
--      "customer": {"name":"Test","email":"t@t.com","phone":"88888888"},
--      "shipping": {"address":"x","canton_code":"101","canton_name":"San José","province_name":"San José"},
--      "items": [{"variant_id":"<decant_variant>","quantity":1}]
--    }'::jsonb);
--    -- pool dropped by size_ml; a pool movement row exists:
--    SELECT product_id, previous_ml, new_ml, ml_delta, reason
--      FROM stock_movements WHERE product_id IS NOT NULL ORDER BY created_at DESC LIMIT 1;
--    -- cancel it → ml refunded, idempotent on a 2nd call:
--    SELECT public.restore_variant_stock('<order_id_from_above>'::uuid);
--    SELECT public.restore_variant_stock('<order_id_from_above>'::uuid);  -- → already_restored
-- ============================================================================
