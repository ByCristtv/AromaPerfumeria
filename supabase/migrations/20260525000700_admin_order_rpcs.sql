-- ============================================================================
-- 20260525000700_admin_order_rpcs.sql
-- Three admin-only RPCs for order management UI (Phase 7):
--   1. advance_order_status — state-machine-validated forward transition
--   2. deny_order_admin     — cancellation with stock restore + status update
--   3. mark_order_paid      — for offline payments (SINPE/cash) where Onvo
--                              doesn't fire a webhook
--
-- All three: SECURITY DEFINER + runtime is_admin() check + revoke from PUBLIC.
-- The is_admin() check inside the function (rather than relying solely on
-- RLS) means the same RPC can be called from server actions / API routes,
-- and security doesn't depend on the calling client.
-- ============================================================================
-- Depends on: existing orders, is_admin(), restore_variant_stock.
-- ============================================================================


-- ────────────────────────────────────────────────────────────────────────────
-- 1. advance_order_status(p_order_id, p_new_status)
-- ────────────────────────────────────────────────────────────────────────────
-- Allowed forward transitions:
--   pending  → received
--   received → shipped
--
-- Everything else (including: pending→shipped skip, *→pending rollback,
-- shipped→anything, *→denied) is rejected. To cancel, use deny_order_admin.

CREATE OR REPLACE FUNCTION public.advance_order_status(
  p_order_id   UUID,
  p_new_status TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Insufficient privilege: admin only.';
  END IF;

  IF p_order_id IS NULL THEN
    RAISE EXCEPTION 'order_id is required';
  END IF;
  IF p_new_status NOT IN ('received', 'shipped') THEN
    RAISE EXCEPTION 'advance_order_status only accepts received or shipped; use deny_order_admin to cancel.';
  END IF;

  SELECT id, order_status INTO v_order
    FROM public.orders
   WHERE id = p_order_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order % does not exist.', p_order_id;
  END IF;

  -- State machine validation
  IF p_new_status = 'received' AND v_order.order_status <> 'pending' THEN
    RAISE EXCEPTION 'Cannot advance to received: order is in % state.', v_order.order_status;
  END IF;
  IF p_new_status = 'shipped' AND v_order.order_status <> 'received' THEN
    RAISE EXCEPTION 'Cannot advance to shipped: order is in % state.', v_order.order_status;
  END IF;

  UPDATE public.orders
     SET order_status = p_new_status::public.order_status
   WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'order_id',          p_order_id,
    'previous_status',   v_order.order_status,
    'new_status',        p_new_status
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.advance_order_status(UUID, TEXT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.advance_order_status(UUID, TEXT) TO authenticated, service_role;


-- ────────────────────────────────────────────────────────────────────────────
-- 2. deny_order_admin(p_order_id, p_reason)
-- ────────────────────────────────────────────────────────────────────────────
-- Cancels an order from any non-terminal state.
--   - Refuses if order is already shipped (terminal) — admin must use
--     Supabase Studio as escape hatch for that rare case.
--   - Refuses if already denied (no-op).
--   - Calls restore_variant_stock (idempotent — safe if a previous sweep
--     or webhook already restored).
--   - If payment_status was 'paid' → flips to 'refunded' (admin still needs
--     to refund via Onvo dashboard separately; this only records intent).
--     Else → flips to 'failed'.
--   - Sets order_status='denied' + appends reason to notes.

CREATE OR REPLACE FUNCTION public.deny_order_admin(
  p_order_id UUID,
  p_reason   TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_new_payment_status TEXT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Insufficient privilege: admin only.';
  END IF;

  IF p_order_id IS NULL THEN
    RAISE EXCEPTION 'order_id is required';
  END IF;
  IF p_reason IS NULL OR TRIM(p_reason) = '' THEN
    RAISE EXCEPTION 'A reason is required when denying an order.';
  END IF;

  SELECT id, order_status, payment_status INTO v_order
    FROM public.orders
   WHERE id = p_order_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order % does not exist.', p_order_id;
  END IF;

  IF v_order.order_status = 'shipped' THEN
    RAISE EXCEPTION 'Cannot deny a shipped order. Use Supabase Studio if escape needed.';
  END IF;

  IF v_order.order_status = 'denied' THEN
    -- Idempotent no-op: order already denied. Don't re-process.
    RETURN jsonb_build_object(
      'order_id', p_order_id,
      'denied',   false,
      'reason',   'already_denied'
    );
  END IF;

  -- Restore stock first (idempotent — guards via stock_movements check).
  PERFORM public.restore_variant_stock(p_order_id);

  -- 'refunded' if money was captured; 'failed' if it never was.
  v_new_payment_status := CASE
    WHEN v_order.payment_status = 'paid' THEN 'refunded'
    ELSE 'failed'
  END;

  UPDATE public.orders
     SET order_status   = 'denied',
         payment_status = v_new_payment_status::public.payment_status,
         notes = COALESCE(notes || E'\n', '') || 'Denied by admin: ' || p_reason
   WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'order_id',                  p_order_id,
    'denied',                    true,
    'previous_payment_status',   v_order.payment_status,
    'new_payment_status',        v_new_payment_status,
    'needs_external_refund',     v_order.payment_status = 'paid'
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.deny_order_admin(UUID, TEXT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.deny_order_admin(UUID, TEXT) TO authenticated, service_role;


-- ────────────────────────────────────────────────────────────────────────────
-- 3. mark_order_paid(p_order_id)
-- ────────────────────────────────────────────────────────────────────────────
-- For OFFLINE payments — customer paid via SINPE Móvil to the store's number,
-- or cash in person. Onvo doesn't fire a webhook for these.
--
-- Strict guards:
--   - Admin only
--   - Order must be in (payment_status=pending, order_status=pending)
--     This prevents accidentally re-marking, double-paying, or marking
--     a denied/restored order as paid (which would diverge from stock).

CREATE OR REPLACE FUNCTION public.mark_order_paid(
  p_order_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Insufficient privilege: admin only.';
  END IF;

  IF p_order_id IS NULL THEN
    RAISE EXCEPTION 'order_id is required';
  END IF;

  SELECT id, order_status, payment_status, payment_provider INTO v_order
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
         -- Preserve the existing provider if it was set (e.g., the order
         -- originally went through Onvo and the customer paid offline as
         -- a fallback). Otherwise mark it 'manual' for audit clarity.
         payment_provider = COALESCE(payment_provider, 'manual')
   WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'order_id',          p_order_id,
    'previous_provider', v_order.payment_provider,
    'marked_paid_at',    now()
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.mark_order_paid(UUID) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.mark_order_paid(UUID) TO authenticated, service_role;


-- ============================================================================
-- VERIFICATION QUERIES — run after the migration
-- ============================================================================
-- 1. All three functions exist with the expected signatures:
--    SELECT proname, pg_get_function_arguments(oid) AS args
--      FROM pg_proc
--     WHERE proname IN ('advance_order_status', 'deny_order_admin', 'mark_order_paid')
--     ORDER BY proname;
--    → expect 3 rows
--
-- 2. Non-admin caller is rejected (run as non-admin, e.g., authenticated user):
--    SELECT public.advance_order_status('00000000-0000-0000-0000-000000000000'::uuid, 'received');
--    → ERROR: Insufficient privilege: admin only.
--
-- 3. Admin caller with bad transition is rejected:
--    -- (Run with an admin session, or via Studio which uses service_role)
--    SELECT public.advance_order_status('<some-pending-order-uuid>'::uuid, 'shipped');
--    → ERROR: Cannot advance to shipped: order is in pending state.
--
-- 4. Permission grants (anon must NOT be present):
--    SELECT routine_name, grantee, privilege_type
--      FROM information_schema.routine_privileges
--     WHERE routine_name IN ('advance_order_status','deny_order_admin','mark_order_paid')
--     ORDER BY routine_name, grantee;
--    → expect rows for authenticated + service_role only (no anon, no PUBLIC).
--
-- 5. Happy path (only if you have a real pending order from testing):
--    SELECT public.advance_order_status('<pending-order-uuid>'::uuid, 'received');
--    → { previous_status: 'pending', new_status: 'received' }
--    SELECT public.advance_order_status('<same-uuid>'::uuid, 'shipped');
--    → { previous_status: 'received', new_status: 'shipped' }
-- ============================================================================
