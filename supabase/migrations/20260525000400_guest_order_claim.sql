-- ============================================================================
-- 20260525000400_guest_order_claim.sql
-- Auto-claim guest orders when a user confirms their email.
-- ============================================================================
-- Flow:
--   1. Guest checks out → orders row with user_id=NULL, customer_email=X
--   2. Later: someone signs up with email X
--   3. ONCE EMAIL X IS CONFIRMED (not at signup — at confirmation):
--      → all orders with user_id=NULL AND customer_email=X are reassigned
--        to the new user's profile, so they appear in their account history.
--
-- Security:
--   - Anyone can sign up with any email in Supabase. The check that proves
--     they actually own the inbox is email confirmation (clicking the link).
--   - Claiming BEFORE confirmation would let an attacker harvest a victim's
--     shipping address, phone, and order history just by signing up.
--   - We gate strictly on email_confirmed_at IS NOT NULL.
--
-- Triggers covered:
--   AFTER INSERT  — when email_confirmed_at is already set at signup
--                   (OAuth providers, magic link, projects with email
--                    confirmation disabled).
--   AFTER UPDATE OF email_confirmed_at — when the user clicks the
--                   confirmation link after an email/password signup.
-- ============================================================================
-- Depends on: existing auth.users + public.orders tables.
-- Does NOT modify handle_new_user; uses a separate trigger that fires AFTER
-- on_auth_user_created (alphabetical order: 'created' < 'email_confirmed').
-- ============================================================================


-- ────────────────────────────────────────────────────────────────────────────
-- 1. claim_guest_orders(p_user_id, p_email) → INT (count of claimed orders)
-- ────────────────────────────────────────────────────────────────────────────
-- Reassigns all unclaimed orders matching the email (case-insensitive) to
-- the given user. Safe to call manually from support tools or backfill scripts.
-- SECURITY DEFINER because it UPDATEs orders.user_id, which is RLS-protected.

CREATE OR REPLACE FUNCTION public.claim_guest_orders(
  p_user_id UUID,
  p_email   TEXT
) RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
BEGIN
  -- Defensive: missing inputs → no-op
  IF p_user_id IS NULL OR p_email IS NULL OR TRIM(p_email) = '' THEN
    RETURN 0;
  END IF;

  UPDATE public.orders
     SET user_id = p_user_id
   WHERE user_id IS NULL
     AND LOWER(customer_email) = LOWER(TRIM(p_email));

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Lock down direct callers: this should only be invoked by the trigger
-- (which bypasses EXECUTE checks) or by service_role/admin tooling.
REVOKE EXECUTE ON FUNCTION public.claim_guest_orders(UUID, TEXT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.claim_guest_orders(UUID, TEXT) TO service_role;


-- ────────────────────────────────────────────────────────────────────────────
-- 2. handle_email_confirmed_claim() — trigger function on auth.users
-- ────────────────────────────────────────────────────────────────────────────
-- Two code paths via TG_OP:
--   INSERT — user signed up with email already confirmed (OAuth, magic link).
--   UPDATE — confirmation timestamp went from NULL to a real value
--            (email/password flow where user later clicks the confirm link).

CREATE OR REPLACE FUNCTION public.handle_email_confirmed_claim()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- New user, email already confirmed at signup time.
    IF NEW.email IS NOT NULL
       AND NEW.email_confirmed_at IS NOT NULL THEN
      PERFORM public.claim_guest_orders(NEW.id, NEW.email);
    END IF;

  ELSIF TG_OP = 'UPDATE' THEN
    -- Specifically: email_confirmed_at transitioned from NULL to NOT NULL.
    -- Other transitions (e.g., admin manually re-setting it) are ignored
    -- because claim_guest_orders is idempotent — if orders were already
    -- claimed, the WHERE user_id IS NULL clause returns 0 rows. So it
    -- would be safe either way; this just avoids extra work.
    IF NEW.email IS NOT NULL
       AND NEW.email_confirmed_at IS NOT NULL
       AND OLD.email_confirmed_at IS NULL THEN
      PERFORM public.claim_guest_orders(NEW.id, NEW.email);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


-- ────────────────────────────────────────────────────────────────────────────
-- 3. Attach the trigger to auth.users
-- ────────────────────────────────────────────────────────────────────────────
-- One trigger, two events. UPDATE OF email_confirmed_at restricts the UPDATE
-- branch to only fire when that specific column is in the SET clause —
-- avoids spurious firings for unrelated column updates.

DROP TRIGGER IF EXISTS on_auth_user_email_confirmed_claim ON auth.users;
CREATE TRIGGER on_auth_user_email_confirmed_claim
  AFTER INSERT OR UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_email_confirmed_claim();


-- ============================================================================
-- VERIFICATION QUERIES — run after the migration
-- ============================================================================
-- 1. Both functions exist:
--    SELECT proname, pg_get_function_arguments(oid) AS args
--      FROM pg_proc
--     WHERE proname IN ('claim_guest_orders', 'handle_email_confirmed_claim')
--     ORDER BY proname;
--    → claim_guest_orders(p_user_id uuid, p_email text)
--    → handle_email_confirmed_claim()
--
-- 2. Trigger is attached to auth.users:
--    SELECT tgname, pg_get_triggerdef(oid)
--      FROM pg_trigger
--     WHERE tgrelid = 'auth.users'::regclass
--       AND tgname LIKE '%claim%';
--    → expect 1 row: on_auth_user_email_confirmed_claim
--
-- 3. Manual smoke test of the helper (safe — no-ops if no matching orders):
--    SELECT public.claim_guest_orders(
--      gen_random_uuid(),
--      'does-not-exist@example.com'
--    );
--    → expect 0
--
-- 4. End-to-end manual test (OPTIONAL — creates and deletes test data):
--    -- a. Insert a fake guest order:
--    -- INSERT INTO public.orders (
--    --   user_id, customer_name, customer_email, customer_phone,
--    --   shipping_address, shipping_canton, shipping_province,
--    --   subtotal, total, source
--    -- ) VALUES (
--    --   NULL, 'Guest Test', 'claim-test@example.com', '00000000',
--    --   '100m sur', 'San José', 'San José',
--    --   1000, 1000, 'web'
--    -- ) RETURNING id;
--    --
--    -- b. Pick an existing user_id (any profile) and call claim:
--    -- SELECT public.claim_guest_orders('<any-existing-user-id>'::uuid, 'claim-test@example.com');
--    --   → expect 1
--    --
--    -- c. Verify the order was reassigned:
--    -- SELECT user_id FROM public.orders WHERE customer_email='claim-test@example.com';
--    --   → expect the user_id from step b
--    --
--    -- d. Cleanup:
--    -- DELETE FROM public.orders WHERE customer_email='claim-test@example.com';
-- ============================================================================
