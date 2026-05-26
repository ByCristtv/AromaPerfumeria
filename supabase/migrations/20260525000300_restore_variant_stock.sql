-- ============================================================================
-- 20260525000300_restore_variant_stock.sql
-- Idempotent inverse of decrease_variant_stock. Restores stock for every
-- order_item of an order, writes 'order_cancelled' stock_movements rows,
-- and returns a summary. Safe to call from:
--   - Onvo webhook handlers on payment.failed / payment.expired
--   - Admin "deny order" action (Phase 7)
-- ============================================================================
-- Depends on: existing stock_movements + product_variants tables,
--             existing is_admin() function, orders + order_items tables.
-- ============================================================================
-- NOTE on a pre-existing bug we're NOT fixing here:
--   The log_stock_change trigger on product_variants.stock writes a
--   'manual_adjustment' stock_movements row for every UPDATE. That means
--   decrease_variant_stock currently writes TWO rows per call (one explicit
--   'order_placed' + one auto 'manual_adjustment'). This new function will
--   inherit the same behavior. Stock counts remain correct; only the audit
--   log has duplicates. Will be fixed in a separate cleanup migration via
--   a session-variable skip flag (`app.skip_stock_audit`).
-- ============================================================================


CREATE OR REPLACE FUNCTION public.restore_variant_stock(
  p_order_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id        UUID;
  v_already_restored BOOLEAN;
  v_item            RECORD;
  v_current_stock   INT;
  v_restored_count  INT := 0;
  v_skipped_count   INT := 0;
BEGIN
  -- ════════ 0. Input validation ════════
  IF p_order_id IS NULL THEN
    RAISE EXCEPTION 'order_id is required';
  END IF;

  -- ════════ 1. Authorization ════════
  -- Allow: service_role (auth.uid() IS NULL when called with service_role key)
  --        or an authenticated admin user.
  -- Block: regular authenticated users (they could trigger restore on someone
  --        else's order to release stock for themselves).
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Insufficient privilege to restore stock for order %.', p_order_id;
  END IF;

  -- ════════ 2. Serialize concurrent calls on same order ════════
  -- FOR UPDATE blocks any other transaction trying to lock this order row
  -- until we COMMIT. Combined with the idempotency check below, this prevents
  -- double-restore from concurrent webhook retries.
  SELECT id INTO v_order_id
    FROM public.orders
   WHERE id = p_order_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order % does not exist.', p_order_id;
  END IF;

  -- ════════ 3. Idempotency check ════════
  -- stock_movements is append-only — its presence is the durable signal that
  -- restore happened. Doesn't depend on order_status, which other paths mutate.
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

  -- ════════ 4. Restore each line item ════════
  FOR v_item IN
    SELECT variant_id, quantity, sku, product_name
      FROM public.order_items
     WHERE order_id = p_order_id
  LOOP
    -- Variant was hard-deleted since order placement (variant_id IS NULL
    -- after ON DELETE SET NULL). Nothing to restore to; skip gracefully.
    IF v_item.variant_id IS NULL THEN
      v_skipped_count := v_skipped_count + 1;
      CONTINUE;
    END IF;

    -- Lock the variant row, read current stock.
    SELECT stock INTO v_current_stock
      FROM public.product_variants
     WHERE id = v_item.variant_id
       FOR UPDATE;

    IF NOT FOUND THEN
      -- Variant row missing (shouldn't happen if FK is intact, but defensive).
      v_skipped_count := v_skipped_count + 1;
      CONTINUE;
    END IF;

    -- Put stock back.
    UPDATE public.product_variants
       SET stock = stock + v_item.quantity
     WHERE id = v_item.variant_id;

    -- Log the explicit restore movement.
    -- (Note: the log_stock_change trigger will ALSO fire and add a
    --  'manual_adjustment' row — pre-existing audit-log bug. Stock count
    --  itself is unaffected.)
    INSERT INTO public.stock_movements (
      variant_id, previous_stock, new_stock, delta, reason, reference_id, performed_by
    ) VALUES (
      v_item.variant_id,
      v_current_stock,
      v_current_stock + v_item.quantity,
      v_item.quantity,
      'order_cancelled',
      p_order_id,
      auth.uid()  -- NULL for service_role, admin UUID for admin actions
    );

    v_restored_count := v_restored_count + 1;
  END LOOP;

  -- ════════ 5. Return summary ════════
  RETURN jsonb_build_object(
    'order_id',       p_order_id,
    'restored',       true,
    'reason',         NULL,
    'items_restored', v_restored_count,
    'items_skipped',  v_skipped_count
  );
END;
$$;

-- Explicit grants:
--   - service_role: webhook handlers + admin server routes (always allowed)
--   - authenticated: admin UI calls via browser (function checks is_admin() at runtime)
--   - anon: NOT granted — guests must never call this
REVOKE EXECUTE ON FUNCTION public.restore_variant_stock(UUID) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.restore_variant_stock(UUID) TO authenticated, service_role;


-- ============================================================================
-- VERIFICATION QUERIES — run after the migration
-- ============================================================================
-- 1. Function exists with correct signature:
--    SELECT proname, pg_get_function_arguments(oid) AS args,
--           pg_get_function_result(oid) AS returns
--      FROM pg_proc
--     WHERE proname = 'restore_variant_stock';
--    → restore_variant_stock(p_order_id uuid) → jsonb
--
-- 2. Calling with non-existent order ID raises cleanly:
--    SELECT public.restore_variant_stock('00000000-0000-0000-0000-000000000000'::uuid);
--    → ERROR: Order 00000000-... does not exist.
--
-- 3. Calling with NULL raises cleanly:
--    SELECT public.restore_variant_stock(NULL);
--    → ERROR: order_id is required
--
-- 4. Permission grants are correct:
--    SELECT grantee, privilege_type
--      FROM information_schema.routine_privileges
--     WHERE routine_name = 'restore_variant_stock';
--    → expect rows for: authenticated, service_role  (NOT anon, NOT public)
--
-- 5. End-to-end idempotency smoke test (OPTIONAL — only if you want to
--    verify the round trip with a real order; uses real stock so be aware):
--
--    -- pick any existing order_id from a test order (or skip this step):
--    -- WITH any_order AS (SELECT id FROM orders WHERE order_status='pending' LIMIT 1)
--    -- SELECT public.restore_variant_stock((SELECT id FROM any_order));
--    -- → {restored: true, items_restored: N, ...}
--    -- SELECT public.restore_variant_stock((SELECT id FROM any_order));
--    -- → {restored: false, reason: 'already_restored', ...}
--
--    If you DO run #5, manually flip the order back to pending after if you
--    want to keep testing: UPDATE orders SET order_status='pending' WHERE id = ...
--    And manually decrement stock and delete the stock_movements 'order_cancelled'
--    row to fully reset. Easier to skip #5 and trust the unit logic.
-- ============================================================================
