-- ============================================================================
-- 20260525000100_checkout_foundation.sql
-- Checkout foundation: shipping zones + cantones + webhook idempotency
-- ============================================================================
-- Idempotent-safe. Targets the public schema on the live Supabase project.
-- Depends on: public.is_admin(), public.handle_updated_at() — both exist.
-- ============================================================================


-- ────────────────────────────────────────────────────────────────────────────
-- 1. SHIPPING_ZONES
-- ────────────────────────────────────────────────────────────────────────────
-- Price tiers customers see at checkout. Each canton maps to ONE zone.
-- Cantones not present in shipping_zone_cantons (next table) fall back to
-- the 'rural' zone in the shipping calculator (added in migration 0002).

CREATE TABLE IF NOT EXISTS public.shipping_zones (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code                    TEXT NOT NULL UNIQUE,
  name                    TEXT NOT NULL,
  base_cost               NUMERIC(12,2) NOT NULL CHECK (base_cost >= 0),
  free_shipping_threshold NUMERIC(12,2) CHECK (free_shipping_threshold IS NULL OR free_shipping_threshold > 0),
  is_active               BOOLEAN NOT NULL DEFAULT TRUE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.shipping_zones IS
  'Shipping price zones. base_cost is what customer pays; free_shipping_threshold (nullable) is the subtotal at which shipping becomes free.';

CREATE INDEX IF NOT EXISTS idx_shipping_zones_code ON public.shipping_zones (code);


-- ────────────────────────────────────────────────────────────────────────────
-- 2. SHIPPING_ZONE_CANTONS — Costa Rica canton → zone mapping
-- ────────────────────────────────────────────────────────────────────────────
-- canton_code is CR's standard 3-digit code: <province_digit><canton_2_digits>.
-- 1=SJ, 2=Alajuela, 3=Cartago, 4=Heredia, 5=Guanacaste, 6=Puntarenas, 7=Limón.
-- E.g.: 101=San José/San José, 401=Heredia/Heredia, 701=Limón/Limón.
--
-- Denormalized (canton/province name copied in) so the address dropdowns
-- can populate from a single table without joining a separate cr-geo dataset.
-- CR canton list is static; the denormalization cost is zero.

CREATE TABLE IF NOT EXISTS public.shipping_zone_cantons (
  canton_code   TEXT PRIMARY KEY,
  canton_name   TEXT NOT NULL,
  province_code TEXT NOT NULL,
  province_name TEXT NOT NULL,
  zone_id       UUID NOT NULL REFERENCES public.shipping_zones(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_szc_zone     ON public.shipping_zone_cantons (zone_id);
CREATE INDEX IF NOT EXISTS idx_szc_province ON public.shipping_zone_cantons (province_code);


-- ────────────────────────────────────────────────────────────────────────────
-- 3. PROCESSED_WEBHOOKS — idempotency log for payment provider callbacks
-- ────────────────────────────────────────────────────────────────────────────
-- Onvo (and future providers) retry webhooks on timeout. The handler MUST
-- be safe to invoke twice with the same event_id without double-charging,
-- double-restoring stock, etc. Pattern:
--   1. Receive webhook
--   2. Verify signature
--   3. INSERT INTO processed_webhooks (provider, event_id) — if conflict, return 200, do nothing
--   4. Otherwise process the event

CREATE TABLE IF NOT EXISTS public.processed_webhooks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider      TEXT NOT NULL,
  event_id      TEXT NOT NULL,
  payload_hash  TEXT,
  processed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_processed_webhooks UNIQUE (provider, event_id)
);

COMMENT ON TABLE public.processed_webhooks IS
  'Webhook idempotency log. Insert (provider, event_id) before processing; ON CONFLICT means already handled.';

CREATE INDEX IF NOT EXISTS idx_pw_processed_at ON public.processed_webhooks (processed_at DESC);


-- ────────────────────────────────────────────────────────────────────────────
-- 4. TRIGGERS — auto-update updated_at on shipping_zones
-- ────────────────────────────────────────────────────────────────────────────
-- shipping_zone_cantons and processed_webhooks intentionally don't have one:
--   cantons are static geographic data (no updated_at column).
--   webhooks are insert-only (no updates expected).

DO $$ BEGIN
  CREATE TRIGGER set_shipping_zones_updated_at
    BEFORE UPDATE ON public.shipping_zones
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ────────────────────────────────────────────────────────────────────────────
-- 5. ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.shipping_zones        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_zone_cantons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processed_webhooks    ENABLE ROW LEVEL SECURITY;

-- shipping_zones: public read (frontend shows "free shipping over X" badge),
--                 admin write.
DROP POLICY IF EXISTS "Anyone can view active shipping zones" ON public.shipping_zones;
CREATE POLICY "Anyone can view active shipping zones"
  ON public.shipping_zones FOR SELECT
  USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admins can view all shipping zones" ON public.shipping_zones;
CREATE POLICY "Admins can view all shipping zones"
  ON public.shipping_zones FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage shipping zones" ON public.shipping_zones;
CREATE POLICY "Admins can manage shipping zones"
  ON public.shipping_zones FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- shipping_zone_cantons: public read (cascading address dropdowns + client-side
--                                     zone preview), admin write.
DROP POLICY IF EXISTS "Anyone can view canton mappings" ON public.shipping_zone_cantons;
CREATE POLICY "Anyone can view canton mappings"
  ON public.shipping_zone_cantons FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "Admins can manage canton mappings" ON public.shipping_zone_cantons;
CREATE POLICY "Admins can manage canton mappings"
  ON public.shipping_zone_cantons FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- processed_webhooks: NO policies. RLS enabled + 0 policies = blocked for all
--                     non-bypass roles. Service role bypasses RLS, which is
--                     exactly what the webhook handler will use server-side.


-- ────────────────────────────────────────────────────────────────────────────
-- 6. SEED — two shipping zones
-- ────────────────────────────────────────────────────────────────────────────
-- Starting CRC values; tune via admin panel later.

INSERT INTO public.shipping_zones (code, name, base_cost, free_shipping_threshold)
VALUES
  ('gam',   'Gran Área Metropolitana', 2500.00,  35000.00),
  ('rural', 'Resto del país',          4500.00,  50000.00)
ON CONFLICT (code) DO NOTHING;


-- ────────────────────────────────────────────────────────────────────────────
-- 7. SEED — GAM cantones (INVU urban-planning definition: 31 cantones)
-- ────────────────────────────────────────────────────────────────────────────
-- San José: 13 cantones. Alajuela: 3. Cartago: 6. Heredia: 9. Total: 31.
-- Any canton NOT in this list falls back to the 'rural' zone in the shipping
-- calculator (Migration 0002).

WITH gam_zone AS (
  SELECT id FROM public.shipping_zones WHERE code = 'gam'
)
INSERT INTO public.shipping_zone_cantons (canton_code, canton_name, province_code, province_name, zone_id)
SELECT v.canton_code, v.canton_name, v.province_code, v.province_name, gam_zone.id
FROM gam_zone, (VALUES
  -- San José province (13)
  ('101', 'San José',               '1', 'San José'),
  ('102', 'Escazú',                 '1', 'San José'),
  ('103', 'Desamparados',           '1', 'San José'),
  ('106', 'Aserrí',                 '1', 'San José'),
  ('107', 'Mora',                   '1', 'San José'),
  ('108', 'Goicoechea',             '1', 'San José'),
  ('109', 'Santa Ana',              '1', 'San José'),
  ('110', 'Alajuelita',             '1', 'San José'),
  ('111', 'Vázquez de Coronado',    '1', 'San José'),
  ('113', 'Tibás',                  '1', 'San José'),
  ('114', 'Moravia',                '1', 'San José'),
  ('115', 'Montes de Oca',          '1', 'San José'),
  ('118', 'Curridabat',             '1', 'San José'),
  -- Alajuela province (3)
  ('201', 'Alajuela',               '2', 'Alajuela'),
  ('205', 'Atenas',                 '2', 'Alajuela'),
  ('208', 'Poás',                   '2', 'Alajuela'),
  -- Cartago province (6)
  ('301', 'Cartago',                '3', 'Cartago'),
  ('302', 'Paraíso',                '3', 'Cartago'),
  ('303', 'La Unión',               '3', 'Cartago'),
  ('306', 'Alvarado',               '3', 'Cartago'),
  ('307', 'Oreamuno',               '3', 'Cartago'),
  ('308', 'El Guarco',              '3', 'Cartago'),
  -- Heredia province (9)
  ('401', 'Heredia',                '4', 'Heredia'),
  ('402', 'Barva',                  '4', 'Heredia'),
  ('403', 'Santo Domingo',          '4', 'Heredia'),
  ('404', 'Santa Bárbara',          '4', 'Heredia'),
  ('405', 'San Rafael',             '4', 'Heredia'),
  ('406', 'San Isidro',             '4', 'Heredia'),
  ('407', 'Belén',                  '4', 'Heredia'),
  ('408', 'Flores',                 '4', 'Heredia'),
  ('409', 'San Pablo',              '4', 'Heredia')
) AS v(canton_code, canton_name, province_code, province_name)
ON CONFLICT (canton_code) DO NOTHING;


-- ============================================================================
-- VERIFICATION QUERIES — run after the migration to confirm
-- ============================================================================
-- SELECT code, name, base_cost, free_shipping_threshold FROM public.shipping_zones ORDER BY code;
--   → expect 2 rows: gam, rural
--
-- SELECT COUNT(*) AS gam_canton_count FROM public.shipping_zone_cantons;
--   → expect 31
--
-- SELECT province_code, COUNT(*) FROM public.shipping_zone_cantons
--   GROUP BY province_code ORDER BY province_code;
--   → expect (1,13) (2,3) (3,6) (4,9)
--
-- SELECT * FROM public.processed_webhooks LIMIT 0;
--   → empty result, no error → table exists with correct schema
-- ============================================================================
