-- ============================================================================
-- 20260609000100_decant_pool_and_integrity.sql
-- Make the new Product Sets / Variant Images / Shared Decant Pool changes
-- actually safe to run in production.
--
-- This migration assumes the live DB ALREADY has (applied via Studio):
--   * product_type enum value 'set'
--   * stock_movement_reason enum value 'transformed_to_decant'
--   * products.decant_stock_ml
--   * product_images.variant_id (+ simple FK)
--   * public.decant_transformations table
--
-- It adds the integrity + transactional logic those changes need but didn't
-- ship with. Findings addressed (see review):
--   #1/#2  decant checkout never touched the pool  → decrease_decant_pool + place_order branch
--   #3     stock_movements couldn't log pool moves → dual-mode (variant | pool) columns
--   #4     product/variant could mismatch          → composite FKs + featured trigger
--   #5/#6  transformations weren't atomic/validated → transform_to_decant RPC
--   #7     decant_transformations had no RLS        → ENABLE + admin policies
--   #8     decant variant.stock was a 2nd source   → CHECK (decant ⇒ stock = 0)
-- ============================================================================
-- Depends on: 20260525000600 (decrease_variant_stock + skip-audit flag),
--             20260525000200 (place_order body reproduced & extended here).
-- ============================================================================


-- ════════════════════════════════════════════════════════════════════════════
-- STEP 0 — Enum values (idempotent; no-ops on your live DB)
-- ────────────────────────────────────────────────────────────────────────────
-- ⚠️  Postgres cannot use a NEWLY added enum value in the SAME transaction that
--     created it. On your live DB these already exist, so the lines below are
--     no-ops and the rest of the script can run in one shot. If you ever replay
--     this on a fresh DB, run STEP 0 ALONE first and let it COMMIT, then run the
--     remainder.
-- ════════════════════════════════════════════════════════════════════════════

ALTER TYPE public.product_type          ADD VALUE IF NOT EXISTS 'set';
ALTER TYPE public.stock_movement_reason ADD VALUE IF NOT EXISTS 'transformed_to_decant';


-- ════════════════════════════════════════════════════════════════════════════
-- STEP 1 — Referential integrity: a variant must belong to the right product
-- ════════════════════════════════════════════════════════════════════════════
-- A plain FK to product_variants(id) only proves the variant EXISTS, not that it
-- belongs to the product on the same row. We add a UNIQUE (product_id, id) target
-- so we can point composite FKs at it.

ALTER TABLE public.product_variants
  ADD CONSTRAINT uq_variant_product_id UNIQUE (product_id, id);


-- 1a. product_images: (product_id, variant_id) must be a real pair.
--     variant_id NULL  → general product asset (MATCH SIMPLE skips the check).
--     variant_id set   → must be a variant OF THIS product.
ALTER TABLE public.product_images
  DROP CONSTRAINT IF EXISTS product_images_variant_id_fkey;

ALTER TABLE public.product_images
  ADD CONSTRAINT product_images_variant_fkey
  FOREIGN KEY (product_id, variant_id)
  REFERENCES public.product_variants (product_id, id)
  ON DELETE CASCADE;   -- deleting a variant drops its size-specific images

CREATE INDEX IF NOT EXISTS idx_images_variant_id
  ON public.product_images (variant_id) WHERE variant_id IS NOT NULL;


-- 1b. decant_transformations: source bottle must belong to the product whose
--     pool it feeds. Keep the existing product_id FK; replace the loose variant FK.
ALTER TABLE public.decant_transformations
  DROP CONSTRAINT IF EXISTS dt_source_variant_id_fkey;

ALTER TABLE public.decant_transformations
  ADD CONSTRAINT dt_source_variant_fkey
  FOREIGN KEY (product_id, source_variant_id)
  REFERENCES public.product_variants (product_id, id);
  -- no ON DELETE → RESTRICT: the ledger is immutable history.

CREATE INDEX IF NOT EXISTS idx_dt_product_id     ON public.decant_transformations (product_id);
CREATE INDEX IF NOT EXISTS idx_dt_source_variant ON public.decant_transformations (source_variant_id);


-- 1c. products.featured_variant_id is ON DELETE SET NULL, so a composite FK
--     can't be used (it would try to NULL the NOT NULL id column). Enforce
--     same-product membership with a lightweight trigger instead.
CREATE OR REPLACE FUNCTION public.check_featured_variant_belongs()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.featured_variant_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM public.product_variants
        WHERE id = NEW.featured_variant_id
          AND product_id = NEW.id
     ) THEN
    RAISE EXCEPTION 'featured_variant_id % does not belong to product %.',
      NEW.featured_variant_id, NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_featured_variant ON public.products;
CREATE TRIGGER trg_check_featured_variant
  BEFORE INSERT OR UPDATE OF featured_variant_id ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.check_featured_variant_belongs();


-- ════════════════════════════════════════════════════════════════════════════
-- STEP 2 — Decant variants have no manual stock (the pool is the source of truth)
-- ════════════════════════════════════════════════════════════════════════════
-- Zero out any stray decant stock first (it was always meaningless under the new
-- model), then forbid it going forward. Dashboards/cancel logic that read
-- variant.stock for decants will now correctly see 0 instead of garbage.

UPDATE public.product_variants
   SET stock = 0
 WHERE product_type = 'decant' AND stock <> 0;

ALTER TABLE public.product_variants
  ADD CONSTRAINT chk_decant_zero_stock
  CHECK (product_type <> 'decant' OR stock = 0);


-- ════════════════════════════════════════════════════════════════════════════
-- STEP 3 — stock_movements becomes dual-mode: variant-level OR pool-level
-- ════════════════════════════════════════════════════════════════════════════
-- The decant pool lives on products and is numeric ml — it cannot be expressed
-- with variant_id (NOT NULL) + integer stock columns. Make those nullable and
-- add a parallel pool block, guarded by a CHECK so each row is exactly one kind.

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

-- Exactly one of {variant block, pool block} must be fully populated.
-- Existing rows (variant_id set, *_ml NULL, product_id NULL) satisfy the 1st arm.
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

CREATE INDEX IF NOT EXISTS idx_movements_product_id
  ON public.stock_movements (product_id) WHERE product_id IS NOT NULL;


-- ════════════════════════════════════════════════════════════════════════════
-- STEP 4 — RLS on the new ledger table
-- ════════════════════════════════════════════════════════════════════════════
-- Without ENABLE RLS, PostgREST would expose decant_transformations to anon.
-- All real writes go through the SECURITY DEFINER RPC below (which bypasses RLS),
-- so these policies just lock down direct client access.

ALTER TABLE public.decant_transformations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view decant transformations"   ON public.decant_transformations;
DROP POLICY IF EXISTS "Admins can insert decant transformations" ON public.decant_transformations;

CREATE POLICY "Admins can view decant transformations"
  ON public.decant_transformations FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can insert decant transformations"
  ON public.decant_transformations FOR INSERT
  WITH CHECK (public.is_admin());


-- ════════════════════════════════════════════════════════════════════════════
-- STEP 5 — decrease_decant_pool(product, ml, order): atomic pool depletion
-- ════════════════════════════════════════════════════════════════════════════
-- Locks the PRODUCT row (not a variant) so concurrent decant orders drawing from
-- the same pool can't oversell. Logs a pool-level stock_movement. Called only by
-- place_order (SECURITY DEFINER), so no role grant is needed.

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

  -- Row lock on the shared pool — the concurrency guard for all decant sizes.
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
-- STEP 6 — transform_to_decant(variant, qty, notes): atomic full-bottle → liquid
-- ════════════════════════════════════════════════════════════════════════════
-- The ONLY sanctioned writer of products.decant_stock_ml. In one transaction:
--   1. writes the immutable ledger row (ml_generated computed, never trusted),
--   2. decrements the full-size bottle stock (audited),
--   3. adds liquid to the pool (audited).
-- Validates admin + that the source is a full_size variant of that product.

CREATE OR REPLACE FUNCTION public.transform_to_decant(
  p_source_variant_id UUID,
  p_quantity          INT,
  p_notes             TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_variant   RECORD;
  v_ml        NUMERIC;
  v_new_pool  NUMERIC;
  v_xform_id  UUID;
  v_actor     UUID := auth.uid();
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can transform inventory into decant liquid.';
  END IF;
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'No authenticated user; transformation requires a known admin.';
  END IF;
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'quantity must be a positive integer.';
  END IF;

  -- Suppress the auto manual_adjustment log; we write the semantic row ourselves.
  PERFORM set_config('app.skip_stock_audit', '1', true);

  -- Lock the bottle being sacrificed.
  SELECT id, product_id, product_type, size_ml, stock, sku
    INTO v_variant
    FROM public.product_variants
   WHERE id = p_source_variant_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Source variant % does not exist.', p_source_variant_id;
  END IF;
  IF v_variant.product_type <> 'full_size' THEN
    RAISE EXCEPTION 'Source variant % must be a full_size bottle (got %).',
      v_variant.sku, v_variant.product_type;
  END IF;
  IF v_variant.stock < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock for %. Available: %, requested: %.',
      v_variant.sku, v_variant.stock, p_quantity;
  END IF;

  -- Server computes the yield; client never supplies ml_generated.
  v_ml := v_variant.size_ml * p_quantity;

  -- 1. Ledger row (pool-inflow source of truth) — get its id for cross-reference.
  INSERT INTO public.decant_transformations (
    product_id, source_variant_id, quantity_used, ml_generated, performed_by
  ) VALUES (
    v_variant.product_id, v_variant.id, p_quantity, v_ml, v_actor
  )
  RETURNING id INTO v_xform_id;

  -- 2. Decrement the bottle stock + variant-level audit row.
  UPDATE public.product_variants
     SET stock = stock - p_quantity
   WHERE id = v_variant.id;

  INSERT INTO public.stock_movements (
    variant_id, previous_stock, new_stock, delta, reason, reference_id, notes, performed_by
  ) VALUES (
    v_variant.id, v_variant.stock, v_variant.stock - p_quantity, -p_quantity,
    'transformed_to_decant', v_xform_id, p_notes, v_actor
  );

  -- 3. Add liquid to the pool + pool-level audit row.
  UPDATE public.products
     SET decant_stock_ml = decant_stock_ml + v_ml
   WHERE id = v_variant.product_id
  RETURNING decant_stock_ml INTO v_new_pool;

  INSERT INTO public.stock_movements (
    product_id, previous_ml, new_ml, ml_delta, reason, reference_id, notes, performed_by
  ) VALUES (
    v_variant.product_id, v_new_pool - v_ml, v_new_pool, v_ml,
    'transformed_to_decant', v_xform_id, p_notes, v_actor
  );

  RETURN jsonb_build_object(
    'transformation_id', v_xform_id,
    'product_id',        v_variant.product_id,
    'source_variant_id', v_variant.id,
    'quantity_used',     p_quantity,
    'ml_generated',      v_ml,
    'new_pool_ml',       v_new_pool
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.transform_to_decant(UUID, INT, TEXT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.transform_to_decant(UUID, INT, TEXT) TO authenticated;  -- admin-gated inside


-- ════════════════════════════════════════════════════════════════════════════
-- STEP 7 — place_order: branch decant lines to the pool instead of variant.stock
-- ════════════════════════════════════════════════════════════════════════════
-- Reproduced from 20260525000200 with TWO changes (marked ★):
--   ★ the per-item SELECT now also reads pv.product_id
--   ★ decant lines call decrease_decant_pool(); everything else calls
--     decrease_variant_stock() exactly as before.

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

    -- ★ also read pv.product_id (needed to address the decant pool)
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

    -- ★ decant lines draw from the shared ml pool; all other types use variant.stock
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


-- ⚠️  NOTE on cancellations: restore_variant_stock() (migration 0003/0006) still
-- only restores variant.stock. It will SKIP decant order_items (they snapshot
-- product_type='decant'); the ml pool is NOT auto-refunded on cancel yet. If you
-- need decant refunds, extend restore_variant_stock to call an increase_decant_pool
-- for decant lines. Out of scope for this migration.


-- ============================================================================
-- VERIFICATION QUERIES — run after the migration
-- ============================================================================
-- 1. Composite FKs in place:
--    SELECT conname FROM pg_constraint
--     WHERE conname IN ('product_images_variant_fkey','dt_source_variant_fkey','uq_variant_product_id');
--    → expect 3 rows
--
-- 2. No decant variant carries manual stock anymore:
--    SELECT COUNT(*) FROM product_variants WHERE product_type='decant' AND stock<>0;  → 0
--
-- 3. Pool depletion works (replace with a real decant variant id):
--    -- before: note products.decant_stock_ml for the parent
--    SELECT public.place_order('{ "customer":{...}, "shipping":{...},
--      "items":[{"variant_id":"<decant_variant>","quantity":1}] }'::jsonb);
--    -- after: decant_stock_ml dropped by size_ml, and a pool row exists:
--    SELECT product_id, previous_ml, new_ml, ml_delta, reason
--      FROM stock_movements WHERE product_id IS NOT NULL ORDER BY created_at DESC LIMIT 1;
--
-- 4. Transformation is atomic + validated (replace with a real full_size id):
--    SELECT public.transform_to_decant('<full_size_variant>', 2, 'sacrificed 2x tester');
--    → decant_transformations gets 1 row; product_variants.stock -2;
--      products.decant_stock_ml += 2*size_ml; two stock_movements rows (variant + pool).
--    SELECT public.transform_to_decant('<a_decant_variant>', 1);  → ERROR must be full_size.
--
-- 5. Integrity rejects cross-product mismatch:
--    UPDATE product_images SET variant_id='<variant_of_OTHER_product>' WHERE id='<img>';
--    → ERROR violates product_images_variant_fkey
-- ============================================================================
