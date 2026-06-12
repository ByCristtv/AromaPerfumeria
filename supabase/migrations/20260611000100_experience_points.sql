-- ============================================================================
-- 20260611000100_experience_points.sql
-- Customer Experience Points (XP) + Rank progression.
--
-- XP is earned ONLY when an order transitions to `received` (never on create,
-- payment, or shipment — a paid order may still be cancelled by an admin).
-- Formula: 50 XP per full ₡1,000 of the order total → floor(total/1000)*50.
--
-- Design:
--   * profiles.experience_points         — running balance (source of truth)
--   * profile_experience_events          — append-only audit log, one row per
--                                          order (UNIQUE order_id = dedup guard)
--   * grant_order_xp(order_id)           — atomic, idempotent award function
--   * trg_orders_grant_xp                — fires grant_order_xp on the
--                                          transition INTO `received`, from any
--                                          path (admin RPC or Studio escape hatch)
--
-- Ranks are NEVER stored — they are derived from XP in the app (lib/rank.ts).
-- ============================================================================
-- Depends on: existing profiles, orders, is_admin().
-- ============================================================================


-- ────────────────────────────────────────────────────────────────────────────
-- 1. Running XP balance on profiles
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS experience_points INTEGER NOT NULL DEFAULT 0
    CHECK (experience_points >= 0);


-- ────────────────────────────────────────────────────────────────────────────
-- 2. XP audit log — one immutable row per rewarded order
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profile_experience_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- UNIQUE is the duplicate-reward guard: an order can grant XP at most once.
  order_id    UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  xp_earned   INTEGER NOT NULL CHECK (xp_earned >= 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profile_experience_events_user
  ON public.profile_experience_events (user_id, created_at DESC);


-- ────────────────────────────────────────────────────────────────────────────
-- 3. RLS — owners (and admins) may read their history; nobody writes directly.
--    All inserts happen through the SECURITY DEFINER function below, which
--    bypasses RLS. The absence of INSERT/UPDATE/DELETE policies is intentional.
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.profile_experience_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own XP events"
  ON public.profile_experience_events
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all XP events"
  ON public.profile_experience_events
  FOR SELECT
  USING (public.is_admin());


-- ────────────────────────────────────────────────────────────────────────────
-- 4. grant_order_xp(p_order_id)
-- ────────────────────────────────────────────────────────────────────────────
-- Atomic + idempotent award:
--   * Locks the order row (FOR UPDATE) so concurrent callers serialize.
--   * Refuses unless the order is actually in `received` (defensive — the
--     trigger only calls it on that transition, but the guard makes the
--     function safe to call from anywhere, e.g. a one-off backfill in Studio).
--   * Skips guest orders (user_id IS NULL) — XP needs a profile to land on.
--   * INSERT ... ON CONFLICT (order_id) DO NOTHING is the race-proof dedup:
--     only the row that actually inserts proceeds to bump the balance.
--
-- Returns JSONB describing what happened (granted / reason / xp_earned).

CREATE OR REPLACE FUNCTION public.grant_order_xp(
  p_order_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order    RECORD;
  v_xp       INTEGER;
  v_inserted INTEGER;
BEGIN
  IF p_order_id IS NULL THEN
    RAISE EXCEPTION 'order_id is required';
  END IF;

  SELECT id, user_id, total, order_status
    INTO v_order
    FROM public.orders
   WHERE id = p_order_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order % does not exist.', p_order_id;
  END IF;

  -- XP is granted ONLY for received orders. Never on pending/paid/shipped/denied.
  IF v_order.order_status <> 'received' THEN
    RETURN jsonb_build_object(
      'granted', false,
      'reason',  'not_received',
      'status',  v_order.order_status
    );
  END IF;

  -- Guest orders have no profile to credit.
  IF v_order.user_id IS NULL THEN
    RETURN jsonb_build_object('granted', false, 'reason', 'guest_order');
  END IF;

  -- 50 XP per full ₡1,000 of the order total.
  v_xp := (FLOOR(v_order.total / 1000))::INTEGER * 50;

  -- Dedup guard: at most one event per order. Loser of a race inserts nothing.
  INSERT INTO public.profile_experience_events (user_id, order_id, xp_earned)
  VALUES (v_order.user_id, v_order.id, v_xp)
  ON CONFLICT (order_id) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  IF v_inserted = 0 THEN
    RETURN jsonb_build_object('granted', false, 'reason', 'already_granted');
  END IF;

  UPDATE public.profiles
     SET experience_points = experience_points + v_xp
   WHERE id = v_order.user_id;

  RETURN jsonb_build_object(
    'granted',   true,
    'order_id',  v_order.id,
    'user_id',   v_order.user_id,
    'xp_earned', v_xp
  );
END;
$$;

-- Not admin-guarded (the trigger must be able to fire for any received order),
-- so lock it down: only the trigger (runs as definer/owner) and service_role
-- (manual backfill in Studio) may invoke it. Authenticated clients cannot.
REVOKE EXECUTE ON FUNCTION public.grant_order_xp(UUID) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.grant_order_xp(UUID) TO service_role;


-- ────────────────────────────────────────────────────────────────────────────
-- 5. Trigger — detect the transition INTO `received` and award XP.
--    Firing on the table (not inside a single RPC) means admin Studio edits
--    that flip status to received are covered too. Idempotent regardless.
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.tg_orders_grant_xp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.grant_order_xp(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_grant_xp ON public.orders;

CREATE TRIGGER trg_orders_grant_xp
  AFTER UPDATE OF order_status ON public.orders
  FOR EACH ROW
  WHEN (NEW.order_status = 'received'
        AND OLD.order_status IS DISTINCT FROM 'received')
  EXECUTE FUNCTION public.tg_orders_grant_xp();


-- ============================================================================
-- VERIFICATION QUERIES — run after the migration
-- ============================================================================
-- 1. Column + table exist:
--    SELECT column_name FROM information_schema.columns
--     WHERE table_name='profiles' AND column_name='experience_points';   -- 1 row
--    SELECT to_regclass('public.profile_experience_events');             -- not null
--
-- 2. Unique guard on order_id:
--    SELECT conname FROM pg_constraint
--     WHERE conrelid='public.profile_experience_events'::regclass AND contype='u';
--
-- 3. Trigger is present:
--    SELECT tgname FROM pg_trigger WHERE tgname='trg_orders_grant_xp';   -- 1 row
--
-- 4. End-to-end (use a real pending order owned by a registered user):
--    SELECT public.advance_order_status('<pending-order-uuid>'::uuid, 'received');
--    SELECT experience_points FROM public.profiles
--      WHERE id = (SELECT user_id FROM public.orders WHERE id='<uuid>');
--    SELECT * FROM public.profile_experience_events WHERE order_id='<uuid>';
--    -- Re-run advance is impossible (state machine); but prove idempotency:
--    SELECT public.grant_order_xp('<uuid>'::uuid);  -- → {granted:false, reason:already_granted}
--
-- 5. Grants: grant_order_xp must NOT be callable by anon/authenticated:
--    SELECT grantee, privilege_type FROM information_schema.routine_privileges
--     WHERE routine_name='grant_order_xp';  -- expect service_role only
-- ============================================================================
