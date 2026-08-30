-- ============================================================================
-- 20260829000100_order_notifications.sql
-- Idempotency ledger + claim/finalize RPCs for admin order email notifications.
-- ============================================================================
-- Adds the plumbing that lets the app email the store owner about new orders
-- WITHOUT ever sending the same notification twice, no matter how many times a
-- webhook / server action / retry fires the same domain event.
--
-- Design mirrors public.processed_webhooks (added in 20260525000100):
--   • one small ledger table
--   • RLS enabled + ZERO policies  → unreachable except via the service_role
--     key (used only by server-side code) and SECURITY DEFINER functions.
--
-- The actual email is sent by the Next.js server layer (lib/notifications/**),
-- not from SQL — there are no Edge Functions in this project and every payment/
-- order domain event already runs server-side with the admin client. These
-- objects only provide the atomic "claim" that makes delivery idempotent.
--
-- Idempotent-safe: re-running this migration is a no-op.
-- Depends on: public.orders (exists).
-- ============================================================================


-- ────────────────────────────────────────────────────────────────────────────
-- 1. ORDER_NOTIFICATIONS — one row per (order, notification_type)
-- ────────────────────────────────────────────────────────────────────────────
-- status lifecycle:
--   pending  → row reserved, not yet claimed by a worker
--   sending  → a worker holds the claim and is calling the email provider
--   sent     → provider accepted the message (terminal, never re-sent)
--   failed   → provider/network error; eligible to be re-claimed and retried
--
-- The UNIQUE (order_id, notification_type) constraint is the whole idempotency
-- story: at most one notification of each type can ever exist per order.

CREATE TABLE IF NOT EXISTS public.order_notifications (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  notification_type   TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'sending', 'sent', 'failed')),
  attempts            INTEGER NOT NULL DEFAULT 0,
  provider_message_id TEXT,
  error_message       TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at             TIMESTAMPTZ,
  CONSTRAINT uq_order_notifications UNIQUE (order_id, notification_type)
);

COMMENT ON TABLE public.order_notifications IS
  'Idempotency ledger for admin order email notifications. One row per (order_id, notification_type); UNIQUE constraint prevents duplicate emails under webhook/action retries.';

CREATE INDEX IF NOT EXISTS idx_order_notifications_order ON public.order_notifications (order_id);


-- ────────────────────────────────────────────────────────────────────────────
-- 2. RLS — enable, define NO policies (service_role + SECURITY DEFINER only)
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.order_notifications ENABLE ROW LEVEL SECURITY;
-- Intentionally no CREATE POLICY: identical stance to processed_webhooks.
-- RLS on + 0 policies = blocked for every anon/authenticated request. The
-- service_role key bypasses RLS, and the functions below are SECURITY DEFINER.


-- ────────────────────────────────────────────────────────────────────────────
-- 3. claim_order_notification(order_id, type) — atomic reservation
-- ────────────────────────────────────────────────────────────────────────────
-- Returns the row id when THIS caller won the right to send, or NULL when the
-- notification is already sent or another worker is mid-send. Callers that get
-- NULL must send nothing — that is what makes duplicate webhooks / retries safe.
--
-- The INSERT ... ON CONFLICT DO NOTHING + SELECT ... FOR UPDATE pair runs inside
-- the function's implicit transaction, so two concurrent callers serialize on
-- the row lock: the first flips pending→sending and returns the id, the second
-- sees 'sending' and returns NULL.

CREATE OR REPLACE FUNCTION public.claim_order_notification(
  p_order_id UUID,
  p_type     TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id     UUID;
  v_status TEXT;
BEGIN
  INSERT INTO public.order_notifications (order_id, notification_type, status)
  VALUES (p_order_id, p_type, 'pending')
  ON CONFLICT (order_id, notification_type) DO NOTHING;

  SELECT id, status
    INTO v_id, v_status
    FROM public.order_notifications
   WHERE order_id = p_order_id
     AND notification_type = p_type
   FOR UPDATE;

  -- Only pending (never attempted) or failed (retry) rows may be claimed.
  IF v_status IN ('pending', 'failed') THEN
    UPDATE public.order_notifications
       SET status     = 'sending',
           attempts   = attempts + 1,
           updated_at = now()
     WHERE id = v_id;
    RETURN v_id;
  END IF;

  -- 'sent' (done) or 'sending' (another worker owns it) → nothing to do.
  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_order_notification(UUID, TEXT) FROM PUBLIC, anon, authenticated;


-- ────────────────────────────────────────────────────────────────────────────
-- 4. finalize_order_notification(id, status, provider_message_id, error) — record outcome
-- ────────────────────────────────────────────────────────────────────────────
-- Closes out a claimed row. p_status is 'sent' or 'failed'. A 'failed' row stays
-- eligible for a future retry via claim_order_notification.

CREATE OR REPLACE FUNCTION public.finalize_order_notification(
  p_id                  UUID,
  p_status              TEXT,
  p_provider_message_id TEXT DEFAULT NULL,
  p_error_message       TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_status NOT IN ('sent', 'failed') THEN
    RAISE EXCEPTION 'finalize_order_notification: p_status must be sent or failed, got %', p_status;
  END IF;

  UPDATE public.order_notifications
     SET status              = p_status,
         provider_message_id = COALESCE(p_provider_message_id, provider_message_id),
         error_message       = p_error_message,
         sent_at             = CASE WHEN p_status = 'sent' THEN now() ELSE sent_at END,
         updated_at          = now()
   WHERE id = p_id;
END;
$$;

REVOKE ALL ON FUNCTION public.finalize_order_notification(UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
