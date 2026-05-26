-- ============================================================================
-- 20260525000500_sweep_abandoned_orders.sql
-- Scheduled sweep for orders that never got a payment outcome.
-- ============================================================================
-- Closes the Phase 5 gap: if a user opens Onvo's hosted checkout then closes
-- the tab without paying or cancelling, no webhook fires. The order sits in
-- payment_status='pending' forever and the reserved stock leaks.
--
-- This migration:
--   1. Enables pg_cron (must be toggled on in Dashboard → Database → Extensions
--      if not already; CREATE EXTENSION fails otherwise — see note at bottom).
--   2. Adds sweep_abandoned_orders() — looks back 30 min for stuck orders,
--      restores stock, marks them denied.
--   3. Schedules it to run every 5 minutes via cron.schedule().
--
-- Depends on: existing orders, order_items, restore_variant_stock function.
-- ============================================================================


-- ────────────────────────────────────────────────────────────────────────────
-- 1. ENABLE pg_cron
-- ────────────────────────────────────────────────────────────────────────────
-- If this CREATE EXTENSION fails with "permission denied", enable pg_cron
-- via Dashboard → Database → Extensions → search "pg_cron" → toggle ON,
-- then re-run this migration. Supabase free tier supports pg_cron but it
-- ships disabled by default.

CREATE EXTENSION IF NOT EXISTS pg_cron;


-- ────────────────────────────────────────────────────────────────────────────
-- 2. sweep_abandoned_orders() function
-- ────────────────────────────────────────────────────────────────────────────
-- For each order matching the abandonment criteria:
--   1. Call restore_variant_stock (idempotent — guards via stock_movements check)
--   2. UPDATE order_status='denied', payment_status='failed'
--      with notes='Sweep: payment timeout (30 min)'
--
-- Returns the count of orders swept so we can verify behavior in logs/queries.

CREATE OR REPLACE FUNCTION public.sweep_abandoned_orders()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_swept INT := 0;
BEGIN
  FOR v_order IN
    SELECT id
      FROM public.orders
     WHERE payment_status = 'pending'
       AND order_status   = 'pending'
       AND payment_provider = 'onvo'
       AND created_at < (now() - interval '30 minutes')
     -- Limit per run to avoid long-running cron transactions if something goes
     -- wrong upstream and many orders pile up. The cron will catch the rest
     -- on the next tick.
     LIMIT 100
  LOOP
    BEGIN
      -- Restore stock first. Idempotent — if a previous run already restored,
      -- this returns { restored: false, reason: 'already_restored' } and the
      -- subsequent UPDATE still moves the order to denied so it stops matching
      -- the sweep query.
      PERFORM public.restore_variant_stock(v_order.id);

      UPDATE public.orders
         SET order_status   = 'denied',
             payment_status = 'failed',
             notes = COALESCE(notes || E'\n', '') || 'Sweep: payment timeout (30 min)'
       WHERE id = v_order.id;

      v_swept := v_swept + 1;
    EXCEPTION WHEN OTHERS THEN
      -- Per-order failures should NOT abort the entire sweep. Log via NOTICE
      -- so the cron run history captures it, then continue to the next order.
      RAISE NOTICE 'sweep_abandoned_orders: order % failed: %', v_order.id, SQLERRM;
    END;
  END LOOP;

  RETURN v_swept;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.sweep_abandoned_orders() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.sweep_abandoned_orders() TO service_role;


-- ────────────────────────────────────────────────────────────────────────────
-- 3. SCHEDULE every 5 minutes
-- ────────────────────────────────────────────────────────────────────────────
-- cron.schedule is idempotent on the (name) — calling it twice with the same
-- name replaces the schedule. We use unschedule first as a defensive cleanup
-- in case the schedule was previously registered under a different definition.

DO $$
BEGIN
  -- Try to remove any prior schedule with this name; ignore errors if absent.
  BEGIN
    PERFORM cron.unschedule('sweep-abandoned-orders');
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  PERFORM cron.schedule(
    'sweep-abandoned-orders',
    '*/5 * * * *',
    $cron$SELECT public.sweep_abandoned_orders();$cron$
  );
END $$;


-- ============================================================================
-- VERIFICATION QUERIES — run after the migration
-- ============================================================================
-- 1. pg_cron extension is enabled:
--    SELECT extname, extversion FROM pg_extension WHERE extname = 'pg_cron';
--    → expect 1 row
--
-- 2. The schedule is registered:
--    SELECT jobid, schedule, command, active FROM cron.job WHERE jobname = 'sweep-abandoned-orders';
--    → expect 1 row, active=true, schedule='*/5 * * * *'
--
-- 3. Manual smoke test (no orders match → returns 0, safe):
--    SELECT public.sweep_abandoned_orders();
--    → expect 0 unless you have stuck orders from earlier testing
--
-- 4. After the first 5-min tick, see cron run history:
--    SELECT runid, jobid, start_time, status, return_message
--      FROM cron.job_run_details
--     WHERE jobid IN (SELECT jobid FROM cron.job WHERE jobname = 'sweep-abandoned-orders')
--     ORDER BY start_time DESC LIMIT 5;
--
-- 5. To force a test stuck order (CAREFUL — modifies real data):
--    UPDATE public.orders
--       SET created_at = now() - interval '40 minutes'
--     WHERE id = '<some-pending-order-id>';
--    Then: SELECT public.sweep_abandoned_orders();
--    → expect 1, order's stock restored, status flipped to denied.
-- ============================================================================
