-- ============================================================================
-- 20260609000200_restore_decant_pool.sql
-- Make order cancellation / return refund DECANT lines back to the shared pool.
-- ============================================================================
-- Bug (flagged as out-of-scope in 20260609000100, now fixed here):
--   After the shared decant pool landed (products.decant_stock_ml +
--   decrease_decant_pool, called by place_order for product_type='decant'
--   lines), the inverse path never caught up. restore_variant_stock only ever
--   restored product_variants.stock. For a cancelled/returned order containing
--   decants it would, at best, SKIP those lines — and at worst try to bump a
--   decant variant's stock, which now violates chk_decant_zero_stock
--   (CHECK (product_type <> 'decant' OR stock = 0)). Either way the liquid the
--   customer reserved was never returned to the pool: a permanent ml leak.
--
-- Fix (two parts):
--   1. increase_decant_pool(product, ml, order, reason) — the mirror of
--      decrease_decant_pool. Locks the PRODUCT row, adds ml back, logs a
--      pool-level stock_movements row with the given reason
--      ('order_cancelled' | 'return').
--   2. restore_variant_stock — branch each order_item by its snapshotted
--      product_type. Decant lines refund size_ml*quantity to the pool via
--      increase_decant_pool and NEVER touch variant.stock (which is pinned at 0
--      for decants). Every other type keeps the exact variant-stock path.
--
-- Preserved from 20260525000600:
--   * the app.skip_stock_audit transaction-local skip flag (still needed for the
--     variant UPDATEs; pool UPDATEs hit products, which log_stock_change ignores)
--   * the already-restored idempotency guard. The pool refund rows carry the same
--     reference_id + ('order_cancelled'|'return') reason, so they fall under the
--     SAME guard — a second call short-circuits before refunding either kind.
-- ============================================================================
-- Depends on: 20260609000100 (decrease_decant_pool, dual-mode stock_movements,
--             chk_decant_zero_stock), 20260525000600 (skip-audit flag +
--             current restore_variant_stock body reproduced & extended here).
-- ============================================================================


-- ════════════════════════════════════════════════════════════════════════════
-- STEP 1 — increase_decant_pool(product, ml, order, reason): atomic pool refund
-- ════════════════════════════════════════════════════════════════════════════
-- Exact mirror of decrease_decant_pool: locks the PRODUCT row (the concurrency
-- guard shared by every decant size) and logs a pool-level stock_movement. The
-- reason is supplied by the caller so the same function serves cancellations
-- ('order_cancelled') and returns ('return'). Called only by
-- restore_variant_stock (SECURITY DEFINER), so no role grant is needed.

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

  -- Only inverse reasons belong on a refund row; reject anything else so this
  -- can't be misused to forge an 'order_placed'/'transformed_to_decant' inflow.
  IF p_reason NOT IN ('order_cancelled', 'return') THEN
    RAISE EXCEPTION 'increase_decant_pool reason must be order_cancelled or return (got %).', p_reason;
  END IF;

  -- Row lock on the shared pool — same guard decrease_decant_pool takes.
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
-- STEP 2 — restore_variant_stock: branch decant lines to the pool refund
-- ════════════════════════════════════════════════════════════════════════════
-- Reproduced from 20260525000600 with the loop body split by product_type
-- (changes marked ★). Everything outside the loop — skip flag, auth, order lock,
-- idempotency guard, return shape — is byte-for-byte the same.

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
  v_product_id       UUID;   -- ★ parent product for a decant line's pool refund
  v_restored_count   INT := 0;
  v_skipped_count    INT := 0;
BEGIN
  -- Suppress the auto manual_adjustment audit log for stock UPDATEs in this txn.
  -- (Pool UPDATEs hit products, which log_stock_change doesn't watch, so this
  --  flag only matters for the variant-stock branch below.)
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

  -- Idempotency: a prior refund (variant OR pool) left an order_cancelled/return
  -- row referencing this order. Its presence short-circuits BOTH branches.
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
    SELECT variant_id, quantity, sku, product_name, product_type, size_ml  -- ★ + type/size_ml
      FROM public.order_items
     WHERE order_id = p_order_id
  LOOP
    -- ★ Decant lines: refund liquid to the shared pool, never to variant.stock
    --   (decants are pinned at stock = 0 by chk_decant_zero_stock — a +quantity
    --   UPDATE here would violate that constraint and abort the whole restore).
    IF v_item.product_type = 'decant' THEN
      -- The pool lives on the parent product, which order_items doesn't snapshot.
      -- Recover it via the variant. If the variant was hard-deleted
      -- (variant_id NULL after ON DELETE SET NULL) or the ml is unknown, we can't
      -- safely target a pool — skip gracefully, exactly like the variant branch.
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

    -- ── Non-decant lines: restore variant.stock exactly as before ──
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

-- Grants unchanged from 20260525000300/000600; restated for self-documentation.
REVOKE EXECUTE ON FUNCTION public.restore_variant_stock(UUID) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.restore_variant_stock(UUID) TO authenticated, service_role;


-- ============================================================================
-- VERIFICATION QUERIES — run after the migration
-- ============================================================================
-- 1. Both functions exist with the expected signatures:
--    SELECT proname, pg_get_function_arguments(oid) AS args,
--           pg_get_function_result(oid) AS returns
--      FROM pg_proc
--     WHERE proname IN ('increase_decant_pool', 'restore_variant_stock')
--     ORDER BY proname;
--    → increase_decant_pool(p_product_id uuid, p_ml numeric, p_order_id uuid,
--                           p_reason stock_movement_reason) → void
--    → restore_variant_stock(p_order_id uuid) → jsonb
--
-- 2. increase_decant_pool is NOT executable by anon/public (called only via
--    restore_variant_stock, SECURITY DEFINER):
--    SELECT grantee, privilege_type FROM information_schema.routine_privileges
--     WHERE routine_name = 'increase_decant_pool';
--    → no rows for anon/public.
--
-- 3. Bad inputs are rejected cleanly:
--    SELECT public.increase_decant_pool(
--      '00000000-0000-0000-0000-000000000000'::uuid, 5, NULL, 'manual_adjustment');
--    → ERROR: reason must be order_cancelled or return ...
--    SELECT public.increase_decant_pool(
--      '00000000-0000-0000-0000-000000000000'::uuid, 0, NULL, 'order_cancelled');
--    → ERROR: Decant ml to refund must be positive ...
--
-- 4. Round trip on a real decant order (replace <decant_order> with an order
--    whose items include a product_type='decant' line):
--    -- note the parent's pool before:
--    SELECT id, decant_stock_ml FROM products WHERE id = '<parent_product>';
--    SELECT public.restore_variant_stock('<decant_order>'::uuid);
--    → { restored: true, items_restored: N, ... }
--    -- pool went UP by size_ml*quantity and a pool refund row exists:
--    SELECT product_id, previous_ml, new_ml, ml_delta, reason, reference_id
--      FROM stock_movements
--     WHERE reference_id = '<decant_order>' AND product_id IS NOT NULL;
--    → one row per decant line, ml_delta > 0, reason='order_cancelled'.
--
-- 5. Idempotency still holds across BOTH kinds:
--    SELECT public.restore_variant_stock('<decant_order>'::uuid);
--    → { restored: false, reason: 'already_restored', ... }  (no double refund)
--
-- 6. Decant variant.stock was never touched (chk_decant_zero_stock intact):
--    SELECT COUNT(*) FROM product_variants WHERE product_type='decant' AND stock<>0;
--    → 0
-- ============================================================================
