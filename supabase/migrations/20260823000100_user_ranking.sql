-- ============================================================================
-- 20260823000100_user_ranking.sql
-- Public XP leaderboard — opt-in usernames + the read path that powers it.
--
-- Builds ENTIRELY on the existing XP system (20260611000100): the leaderboard
-- reads `profiles.experience_points`, the same running balance the profile page
-- already shows. No second XP store, no stored ranks — ranks stay derived from
-- XP in lib/rank.ts, so there is still exactly one source of truth.
--
-- What this adds:
--   * profiles.username         — public nickname, NULL until the user sets one
--   * profiles.show_in_ranking  — explicit opt-in, FALSE for every existing user
--   * three constraints that make an invalid state impossible at the DB level
--   * one partial index sized to the leaderboard query
--   * get_ranking_top()         — the ONLY way the public reads other profiles
--
-- Safety for the live database:
--   * Both columns are additive and nullable/defaulted, so every existing row
--     stays valid and nobody is opted in by the migration.
--   * PG 11+ adds a defaulted NOT NULL column without rewriting the table.
--   * The CHECKs are added in the same migration as the columns they guard, so
--     their validation scan is satisfied by construction (no NOT VALID dance).
--   * Every statement is idempotent — re-running is a no-op.
--
-- Run inside the Supabase SQL Editor (matches the paste-into-Studio workflow).
-- ============================================================================
-- Depends on: public.profiles (id, experience_points, created_at).
-- ============================================================================


-- ────────────────────────────────────────────────────────────────────────────
-- 1. Columns
-- ────────────────────────────────────────────────────────────────────────────
-- `username` is nullable on purpose: an account is perfectly usable without
-- one, and back-filling synthetic nicknames for existing customers would both
-- invent public identities nobody chose and leak account age via the pattern.
--
-- `show_in_ranking` defaults FALSE so appearing publicly is always an action the
-- user took, never a side effect of this migration.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS show_in_ranking BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.profiles.username IS
  'Public nickname shown on the leaderboard. NULL = the user never set one. '
  'Case-insensitively unique; see idx_profiles_username_lower.';

COMMENT ON COLUMN public.profiles.show_in_ranking IS
  'Explicit opt-in to the public leaderboard. Requires a username '
  '(profiles_ranking_requires_username).';


-- ────────────────────────────────────────────────────────────────────────────
-- 2. Constraints — the real validation boundary
-- ────────────────────────────────────────────────────────────────────────────
-- RLS lets a user UPDATE their own profile row directly with the anon key, so
-- the server action is a convenience layer, not a gate. Everything that must be
-- true of a username is therefore enforced here, where nothing can route around
-- it.

-- 2a. Shape. 3–20 chars, alphanumerics plus `.` and `_`, and it must both start
--     and end alphanumeric. That last rule is what rejects the usernames that
--     cause UI and moderation problems: leading/trailing dots that read as
--     truncation ("krov…"), all-punctuation names, and names that differ only by
--     surrounding separators. Deliberately ASCII-only — homoglyph and
--     bidirectional-override characters are the standard impersonation vector on
--     a public list of names, and this ruleset excludes them wholesale.
--     Whitespace can't appear at all, so trimming is enforced by construction.
DO $$
BEGIN
  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_username_format
    CHECK (
      username IS NULL
      OR username ~ '^[A-Za-z0-9][A-Za-z0-9._]{1,18}[A-Za-z0-9]$'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2b. Reserved names. A short, deliberate list: nothing on a public leaderboard
--     should be able to pose as the store or as staff. Kept in SQL rather than
--     only in Zod so a hand-rolled REST call can't claim one either.
DO $$
BEGIN
  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_username_not_reserved
    CHECK (
      username IS NULL
      OR lower(username) NOT IN (
        'admin', 'administrador', 'administrator', 'krov', 'krovperfumeria',
        'moderador', 'moderator', 'root', 'soporte', 'support', 'system',
        'sistema', 'staff', 'oficial', 'official', 'null', 'undefined'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2c. Integrity: opting in without a username is not a state that can exist.
--     This is the requirement "ranking visibility cannot be enabled without a
--     valid username" expressed where it actually holds. Clearing a username
--     while opted in raises here; the server action pre-empts that by turning
--     the flag off in the SAME update (see app/profile/actions.ts).
DO $$
BEGIN
  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_ranking_requires_username
    CHECK (show_in_ranking = FALSE OR username IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2d. Uniqueness, case-insensitively. "Aurora" and "aurora" are the same person
--     to a reader, so they must be the same name to the database. A partial
--     UNIQUE index (rather than a UNIQUE constraint) is what lets the unlimited
--     number of username-less profiles coexist: NULLs are simply not indexed.
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_lower
  ON public.profiles (lower(username))
  WHERE username IS NOT NULL;


-- ────────────────────────────────────────────────────────────────────────────
-- 3. Leaderboard index
-- ────────────────────────────────────────────────────────────────────────────
-- Exactly matches get_ranking_top()'s WHERE + ORDER BY, so the top 10 is an
-- index scan that stops after 10 rows no matter how large `profiles` gets — the
-- leaderboard's cost is independent of the number of customers.
--
-- Partial on the opt-in predicate: participants are a small subset of accounts,
-- so the index stays proportional to who actually competes, not who registered.
-- The tie-breaker columns are part of the key so ordering never needs a sort.
--
-- Note: plain CREATE INDEX (not CONCURRENTLY) because Studio runs statements in
-- a transaction, which CONCURRENTLY forbids. The predicate keeps the build small
-- enough that the brief lock is not a concern here.
CREATE INDEX IF NOT EXISTS idx_profiles_ranking_leaderboard
  ON public.profiles (experience_points DESC, created_at ASC, id ASC)
  WHERE show_in_ranking = TRUE AND username IS NOT NULL;


-- ────────────────────────────────────────────────────────────────────────────
-- 4. get_ranking_top(p_limit)
-- ────────────────────────────────────────────────────────────────────────────
-- The public read path, and the reason no RLS policy on `profiles` had to be
-- widened. A "anyone can SELECT profiles WHERE show_in_ranking" policy would
-- have exposed every COLUMN of those rows — phone, full_name, role, id. This
-- function returns three values and nothing else, so the privacy boundary is the
-- function's signature rather than a promise the frontend has to keep.
--
-- SECURITY DEFINER: runs as the owner, so it reads past RLS. That is safe here
-- precisely because the projection is fixed and the WHERE clause is not a
-- parameter — a caller cannot ask it for a different set of rows or columns.
--
-- Position is computed in SQL via ROW_NUMBER() over the same total ordering used
-- to sort, so the number the UI prints is the database's answer, not a
-- re-derivation from array position.
--
-- Ordering is a TOTAL order and therefore deterministic across requests:
--     experience_points DESC  → the ranking itself
--     created_at ASC          → ties break in favour of the longer-standing
--                               account, which is both stable and defensible
--     id ASC                  → final tie-break; ids are unique, so no two rows
--                               can ever compare equal and swap between calls
--
-- Rank names are NOT returned. They are a pure function of XP (lib/rank.ts) and
-- duplicating the thresholds in SQL would create a second source of truth that
-- silently drifts. The caller derives them from the XP in this result.

CREATE OR REPLACE FUNCTION public.get_ranking_top(
  p_limit INTEGER DEFAULT 10
) RETURNS TABLE (
  rank_position     BIGINT,
  username          TEXT,
  experience_points INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ROW_NUMBER() OVER (
      ORDER BY p.experience_points DESC, p.created_at ASC, p.id ASC
    ) AS rank_position,
    p.username,
    p.experience_points
  FROM public.profiles p
  WHERE p.show_in_ranking = TRUE
    AND p.username IS NOT NULL
  ORDER BY p.experience_points DESC, p.created_at ASC, p.id ASC
  -- Clamped server-side: a caller cannot turn the leaderboard into a full
  -- export of every participant by passing a huge limit.
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 10), 1), 50);
$$;

COMMENT ON FUNCTION public.get_ranking_top(INTEGER) IS
  'Public XP leaderboard. Returns only opted-in profiles with a username, and '
  'only their position, username and XP. Deterministic ordering: XP DESC, '
  'created_at ASC, id ASC.';

-- Readable by the world (the leaderboard is a public page), but nothing else
-- about a profile becomes readable with it.
REVOKE EXECUTE ON FUNCTION public.get_ranking_top(INTEGER) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_ranking_top(INTEGER) TO anon, authenticated;


-- ============================================================================
-- NOTE ON RLS — intentionally unchanged.
-- ============================================================================
-- The existing profiles policies still stand exactly as they were:
--   "Users can view own profile"    → SELECT USING (auth.uid() = id)
--   "Users can update own profile"  → UPDATE USING/WITH CHECK (auth.uid() = id)
--   "Admins can view all profiles"  → SELECT USING (is_admin())
--
-- Those already grant a user read AND write access to their own `username` and
-- `show_in_ranking`, because both live on the row the policies cover. Nothing
-- was weakened to make this feature work, and no new policy was needed: the
-- public side reads through get_ranking_top() instead of through the table.
-- ============================================================================


-- ============================================================================
-- VERIFICATION QUERIES — run after the migration
-- ============================================================================
-- 1. Columns exist with the right defaults:
--    SELECT column_name, data_type, is_nullable, column_default
--      FROM information_schema.columns
--     WHERE table_name = 'profiles'
--       AND column_name IN ('username', 'show_in_ranking');
--
-- 2. No existing user was opted in or given a name:
--    SELECT count(*) FROM public.profiles
--     WHERE show_in_ranking = TRUE OR username IS NOT NULL;   -- expect 0
--
-- 3. Constraints are present:
--    SELECT conname FROM pg_constraint
--     WHERE conrelid = 'public.profiles'::regclass
--       AND conname LIKE 'profiles_username%'
--        OR conname = 'profiles_ranking_requires_username';
--
-- 4. Invalid states are rejected (each must ERROR):
--    UPDATE public.profiles SET username = 'ab'            WHERE id = '<uuid>';  -- too short
--    UPDATE public.profiles SET username = '.aurora'       WHERE id = '<uuid>';  -- leading dot
--    UPDATE public.profiles SET username = 'has space'     WHERE id = '<uuid>';  -- whitespace
--    UPDATE public.profiles SET username = 'admin'         WHERE id = '<uuid>';  -- reserved
--    UPDATE public.profiles SET show_in_ranking = TRUE     WHERE id = '<uuid>';  -- no username
--
-- 5. Case-insensitive uniqueness (second statement must ERROR):
--    UPDATE public.profiles SET username = 'Aurora' WHERE id = '<uuid-a>';
--    UPDATE public.profiles SET username = 'aurora' WHERE id = '<uuid-b>';
--
-- 6. The leaderboard itself:
--    SELECT * FROM public.get_ranking_top();      -- ≤ 10 rows, positions 1..n
--    SELECT * FROM public.get_ranking_top(1000);  -- clamped to 50
--
-- 7. The index is actually used (expect an Index Scan, never a Seq Scan + Sort):
--    EXPLAIN ANALYZE
--    SELECT p.username, p.experience_points FROM public.profiles p
--     WHERE p.show_in_ranking = TRUE AND p.username IS NOT NULL
--     ORDER BY p.experience_points DESC, p.created_at ASC, p.id ASC
--     LIMIT 10;
--
-- 8. Grants — anon/authenticated may execute, and that is all:
--    SELECT grantee, privilege_type FROM information_schema.routine_privileges
--     WHERE routine_name = 'get_ranking_top';
-- ============================================================================
