-- ============================================================================
-- 20260804000300  wholesale_profiles — table-level GRANTs
-- ----------------------------------------------------------------------------
-- "permission denied for table wholesale_profiles" is a Postgres role-privilege
-- error, raised BEFORE row-level security is even evaluated. RLS policies only
-- decide which ROWS a role can see once it already has table-level access —
-- they never substitute for it.
--
-- Every other table in this project was created through Supabase's dashboard
-- table editor, which auto-runs the platform's default GRANTs to anon /
-- authenticated / service_role. wholesale_profiles was created directly via SQL
-- (the B2B column migration applied straight to the live DB), so it never
-- received those grants — hence admins hitting "permission denied" even though
-- the "Admins can view all wholesale applications" RLS policy is correct.
--
-- Safe to re-run (GRANT is idempotent).
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON public.wholesale_profiles TO authenticated;

-- No DELETE, and no grant to `anon` at all: applications are created/edited by
-- their signed-in owner (RLS scopes both to `auth.uid() = user_id`) or reviewed
-- through the SECURITY DEFINER review_wholesale_application() RPC, which runs
-- as the function owner and doesn't need row access via this grant.
