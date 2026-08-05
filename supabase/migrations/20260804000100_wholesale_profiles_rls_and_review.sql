-- ============================================================================
-- 20260804000100  Wholesale profiles — RLS + admin review RPC
-- ----------------------------------------------------------------------------
-- The wholesale_profiles table + the wholesale columns on product_variants /
-- orders / order_items were added to the live DB directly. This migration adds
-- the two pieces that were NOT part of that column migration:
--
--   1. Row-Level Security for wholesale_profiles (owners manage their own
--      application; admins can read every application).
--   2. review_wholesale_application(): the admin-guarded, atomic approve/reject
--      RPC that also promotes the profile role on approval.
--
-- Safe + idempotent: re-running drops/recreates policies and CREATE OR REPLACEs
-- the function. It does NOT touch place_order (see the sibling migration).
-- Run inside the Supabase SQL Editor (matches the paste-into-Studio workflow).
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 1. Row-Level Security
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.wholesale_profiles ENABLE ROW LEVEL SECURITY;

-- Owner: read own application.
DROP POLICY IF EXISTS "Users can view own wholesale application" ON public.wholesale_profiles;
CREATE POLICY "Users can view own wholesale application"
  ON public.wholesale_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Owner: create own application. Forced to start 'pending' so a user can never
-- self-approve by seeding the row with application_status = 'approved'.
DROP POLICY IF EXISTS "Users can create own wholesale application" ON public.wholesale_profiles;
CREATE POLICY "Users can create own wholesale application"
  ON public.wholesale_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id AND application_status = 'pending');

-- Owner: edit own application, but only ever back to 'pending' (re-apply after a
-- rejection / fix a typo). They can never move their own row to approved/rejected.
DROP POLICY IF EXISTS "Users can update own wholesale application" ON public.wholesale_profiles;
CREATE POLICY "Users can update own wholesale application"
  ON public.wholesale_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND application_status = 'pending');

-- Admin: read every application (drives the /admin/wholesale review queue).
-- Approve/reject go through the SECURITY DEFINER RPC below, so admins need no
-- direct UPDATE policy here.
DROP POLICY IF EXISTS "Admins can view all wholesale applications" ON public.wholesale_profiles;
CREATE POLICY "Admins can view all wholesale applications"
  ON public.wholesale_profiles
  FOR SELECT
  USING (public.is_admin());

-- ────────────────────────────────────────────────────────────────────────────
-- 2. review_wholesale_application()  — admin approve / reject
-- ────────────────────────────────────────────────────────────────────────────
-- SECURITY DEFINER so it can update profiles.role (no user/admin policy allows
-- touching another user's role) and wholesale_profiles atomically. Guards on
-- is_admin() internally — the third line of defense after proxy.ts and the
-- server action. Mirrors the shape of the existing admin order RPCs.
--
--   approve → wholesale_profiles.application_status = 'approved'
--             AND profiles.role = 'wholesale'
--   reject  → wholesale_profiles.application_status = 'rejected'
--             (and defensively demote a previously-approved account back to
--              'customer' so role and status can never disagree)

CREATE OR REPLACE FUNCTION public.review_wholesale_application(
  p_user_id  UUID,
  p_decision TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_status TEXT;
  v_current_role   public.user_role;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Insufficient privilege: admin role required.';
  END IF;

  IF p_decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid decision "%": must be approved or rejected.', p_decision;
  END IF;

  SELECT wp.application_status, pr.role
    INTO v_current_status, v_current_role
    FROM public.wholesale_profiles wp
    JOIN public.profiles pr ON pr.id = wp.user_id
   WHERE wp.user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wholesale application for user % does not exist.', p_user_id;
  END IF;

  UPDATE public.wholesale_profiles
     SET application_status = p_decision,
         updated_at         = now()
   WHERE user_id = p_user_id;

  IF p_decision = 'approved' THEN
    -- Promote to wholesale. Never touch an admin account.
    UPDATE public.profiles
       SET role = 'wholesale', updated_at = now()
     WHERE id = p_user_id AND role <> 'admin';
  ELSE
    -- Rejection: if the account had been promoted, revoke it so an unapproved
    -- account can never keep the wholesale role.
    UPDATE public.profiles
       SET role = 'customer', updated_at = now()
     WHERE id = p_user_id AND role = 'wholesale';
  END IF;

  RETURN jsonb_build_object(
    'user_id',            p_user_id,
    'application_status', p_decision,
    'previous_status',    v_current_status
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.review_wholesale_application(UUID, TEXT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.review_wholesale_application(UUID, TEXT) TO authenticated;
