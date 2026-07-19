-- ============================================================================
-- 20260718000100_mark_order_paid_allow_received.sql
-- Let admins record an offline payment on an order that already advanced to
-- 'received'. Recovers orders stranded by the old admin-panel button logic.
-- ============================================================================
-- Depends on: 20260611000200_admin_orders.sql (3-arg mark_order_paid).
--
-- PROBLEM
--   The admin panel rendered "Marcar pagado" only while order_status='pending',
--   and "Confirmar (Recibido)" with no payment precondition. An admin who
--   confirmed receipt first pushed the order to order_status='received', at
--   which point mark_order_paid() refused it:
--
--     'Order is in order_status=%; cannot mark as paid.'
--
--   The order was then permanently unpayable through both the UI and the RPC —
--   a SINPE order that was really paid stayed payment_status='pending' forever,
--   corrupting revenue reporting.
--
-- FIX
--   Allow marking paid while order_status IN ('pending','received'). Recording
--   that money arrived is orthogonal to fulfilment progress; the only states
--   where it is genuinely wrong are terminal ones.
--
--   Still refused:
--     - payment_status <> 'pending'  (already paid / failed / refunded — unchanged)
--     - order_status = 'shipped'     (terminal; a shipped-but-unpaid order is a
--                                     dispute, not a data-entry fix)
--     - order_status = 'denied'      (cancelled + stock restored; re-paying it
--                                     would desync inventory)
--
--   The admin UI additionally enforces paid-before-received going forward, so
--   this path is a recovery mechanism rather than the normal flow.
--
-- Everything else (signature, reference/note handling, provider fallback,
-- return shape, grants) is preserved verbatim from 20260611000200.
-- ============================================================================

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

  -- CHANGED: was `<> 'pending'`. 'received' is now accepted so a genuinely paid
  -- order that advanced too early can still be reconciled.
  IF v_order.order_status NOT IN ('pending', 'received') THEN
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
-- VERIFICATION — run after applying
-- ============================================================================
-- 1. Find orders stranded by the old logic (these are what this migration frees):
--    SELECT id, order_number, order_status, payment_status, payment_provider, created_at
--      FROM public.orders
--     WHERE payment_status = 'pending'
--       AND order_status IN ('received','shipped')
--     ORDER BY created_at DESC;
--
--    → 'received' rows are now fixable from /admin/orders/[id].
--    → 'shipped' rows still are not (deliberate) — reconcile those by hand:
--      UPDATE public.orders
--         SET payment_status='paid', paid_at=now(),
--             payment_provider=COALESCE(payment_provider,'manual')
--       WHERE id = '<order-id>';
--
-- 2. Guard still rejects terminal states:
--    SELECT public.mark_order_paid('<a-shipped-unpaid-order-id>');
--    → ERROR: Order is in order_status=shipped; cannot mark as paid.
--
-- 3. Double-pay still rejected:
--    SELECT public.mark_order_paid('<an-already-paid-order-id>');
--    → ERROR: Order is in payment_status=paid; cannot mark as paid.
-- ============================================================================
