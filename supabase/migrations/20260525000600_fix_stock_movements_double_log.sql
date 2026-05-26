-- ============================================================================
-- 20260525000600_fix_stock_movements_double_log.sql
-- Eliminate the redundant 'manual_adjustment' rows that auto-fired whenever
-- decrease_variant_stock / restore_variant_stock UPDATE'd a variant's stock.
-- ============================================================================
-- Bug:
--   The log_stock_change trigger fires on every product_variants.stock UPDATE.
--   Our existing RPCs (decrease_variant_stock, restore_variant_stock) also
--   write their own stock_movements row with the semantically correct reason
--   ('order_placed' / 'order_cancelled'). Result: TWO movement rows per RPC
--   call. Stock counts unaffected; audit log noisy.
--
-- Fix:
--   Use a session-variable skip flag. The trigger checks
--   `current_setting('app.skip_stock_audit', true)` and returns early if set.
--   Each RPC sets it transaction-locally (third arg = true → auto-cleared on
--   COMMIT/ROLLBACK, can't leak across connection pool checkouts) before
--   UPDATing stock.
--
-- Admin direct edits (Phase 7 will have an admin UI editing stock through the
-- normal table) continue to log 'manual_adjustment' rows — they don't set the
-- skip flag, so the trigger fires normally.
-- ============================================================================


-- ────────────────────────────────────────────────────────────────────────────
-- 1. log_stock_change — skip if app.skip_stock_audit = '1'
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.log_stock_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Caller (decrease_variant_stock / restore_variant_stock) is logging the
  -- movement itself with the correct semantic reason. Skip the auto-log.
  -- The second arg `true` to current_setting suppresses errors for missing
  -- key — defaults to NULL/'' so the comparison stays safe.
  IF current_setting('app.skip_stock_audit', true) = '1' THEN
    RETURN NEW;
  END IF;

  IF OLD.stock IS DISTINCT FROM NEW.stock THEN
    INSERT INTO public.stock_movements (
      variant_id, previous_stock, new_stock, delta, reason, performed_by
    ) VALUES (
      NEW.id,
      OLD.stock,
      NEW.stock,
      NEW.stock - OLD.stock,
      'manual_adjustment',
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$;


-- ────────────────────────────────────────────────────────────────────────────
-- 2. decrease_variant_stock — set the skip flag before UPDATE
-- ────────────────────────────────────────────────────────────────────────────
-- Body is unchanged except for the new set_config call. Including the full
-- function so the migration is self-documenting (no need to cross-reference
-- the original to read this one).

CREATE OR REPLACE FUNCTION public.decrease_variant_stock(
  p_variant_id  UUID,
  p_quantity    INT,
  p_order_id    UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_stock INT;
BEGIN
  -- Tell log_stock_change to skip the manual_adjustment auto-log for this txn.
  -- Third arg `true` = transaction-local; auto-cleared at COMMIT/ROLLBACK so
  -- it can't leak across connection-pool checkouts.
  PERFORM set_config('app.skip_stock_audit', '1', true);

  -- Lock the row to prevent race conditions.
  SELECT stock INTO v_current_stock
  FROM public.product_variants
  WHERE id = p_variant_id
  FOR UPDATE;

  IF v_current_stock IS NULL THEN
    RAISE EXCEPTION 'Variant % does not exist.', p_variant_id;
  END IF;

  IF v_current_stock < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock for variant %. Available: %, requested: %.',
      p_variant_id, v_current_stock, p_quantity;
  END IF;

  UPDATE public.product_variants
     SET stock = stock - p_quantity
   WHERE id = p_variant_id;

  -- Log the movement explicitly with the semantic reason. The auto-trigger
  -- is suppressed by the skip flag set above.
  INSERT INTO public.stock_movements (
    variant_id, previous_stock, new_stock, delta, reason, reference_id, performed_by
  ) VALUES (
    p_variant_id,
    v_current_stock,
    v_current_stock - p_quantity,
    -p_quantity,
    'order_placed',
    p_order_id,
    auth.uid()
  );
END;
$$;


-- ────────────────────────────────────────────────────────────────────────────
-- 3. restore_variant_stock — set the skip flag before each per-item UPDATE
-- ────────────────────────────────────────────────────────────────────────────
-- Set the flag once at the top of the function — it persists for the whole
-- transaction, covering every loop iteration's UPDATE.

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
  v_restored_count   INT := 0;
  v_skipped_count    INT := 0;
BEGIN
  -- Suppress the auto manual_adjustment audit log for stock UPDATEs in this txn.
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
    SELECT variant_id, quantity, sku, product_name
      FROM public.order_items
     WHERE order_id = p_order_id
  LOOP
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


-- ============================================================================
-- VERIFICATION QUERIES — run after the migration
-- ============================================================================
-- 1. All three functions exist and have the expected definitions:
--    SELECT proname FROM pg_proc
--     WHERE proname IN ('log_stock_change', 'decrease_variant_stock', 'restore_variant_stock')
--     ORDER BY proname;
--    → expect 3 rows
--
-- 2. Smoke test (no real stock change, just verifies new behavior compiles):
--    SELECT public.restore_variant_stock('00000000-0000-0000-0000-000000000000'::uuid);
--    → ERROR: Order ... does not exist. (just confirms function still rejects bad inputs)
--
-- 3. After your next test order, count rows added to stock_movements per order:
--    SELECT reference_id AS order_id, COUNT(*) AS movement_count, array_agg(reason) AS reasons
--      FROM public.stock_movements
--     WHERE reference_id IS NOT NULL
--       AND created_at > now() - interval '1 hour'
--     GROUP BY reference_id
--     ORDER BY MIN(created_at) DESC LIMIT 10;
--    → NEW orders placed AFTER this migration should have movement_count = (#items),
--      one row per item, all with reason='order_placed' — no extra 'manual_adjustment'.
--
-- 4. Admin direct stock edits still audit correctly (verify in Phase 7 or by
--    manually editing a variant's stock in Supabase Studio):
--    -- After: UPDATE product_variants SET stock = stock + 1 WHERE id = '...' in Studio:
--    SELECT reason, delta, performed_by FROM stock_movements
--     WHERE variant_id = '...' ORDER BY created_at DESC LIMIT 1;
--    → expect reason='manual_adjustment' (the skip flag wasn't set by Studio).
-- ============================================================================
