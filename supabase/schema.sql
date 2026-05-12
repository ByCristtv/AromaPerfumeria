-- ============================================================================
-- AROMA PERFUMERÍA — Production Database Schema
-- Platform: Supabase (PostgreSQL 15+)
-- Version:  1.0.0
-- ============================================================================
-- This script is idempotent-safe and ordered by dependency.
-- Run it inside a Supabase SQL Editor or via psql against the project DB.
-- ============================================================================


-- ────────────────────────────────────────────────────────────────────────────
-- 0. EXTENSIONS
-- ────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "pgcrypto";      -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";       -- fuzzy / trigram search
CREATE EXTENSION IF NOT EXISTS "unaccent";      -- accent-insensitive search


-- ────────────────────────────────────────────────────────────────────────────
-- 1. CUSTOM TYPES
-- ────────────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('customer', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.product_type AS ENUM ('full_size', 'decant');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.order_status AS ENUM ('pending', 'received', 'shipped', 'denied');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.stock_movement_reason AS ENUM (
    'manual_adjustment',
    'order_placed',
    'order_cancelled',
    'restock',
    'correction',
    'return'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ────────────────────────────────────────────────────────────────────────────
-- 2. CORE TABLES
-- ────────────────────────────────────────────────────────────────────────────

-- 2.1  PROFILES (extends auth.users)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT,
  phone         TEXT,
  avatar_url    TEXT,
  role          public.user_role NOT NULL DEFAULT 'customer',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'Extended user profile linked 1-to-1 with auth.users.';


-- 2.2  BRANDS
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.brands (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL UNIQUE,
  slug          TEXT NOT NULL UNIQUE,
  logo_url      TEXT,
  description   TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_brands_slug ON public.brands (slug);


-- 2.3  CATEGORIES
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.categories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL UNIQUE,
  slug          TEXT NOT NULL UNIQUE,
  description   TEXT,
  image_url     TEXT,
  parent_id     UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  position      INT NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_categories_slug      ON public.categories (slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id  ON public.categories (parent_id);

COMMENT ON COLUMN public.categories.parent_id IS 'Self-referencing FK to support nested category trees.';


-- 2.4  PRODUCTS
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.products (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  slug                TEXT NOT NULL UNIQUE,
  brand_id            UUID NOT NULL REFERENCES public.brands(id) ON DELETE RESTRICT,
  description         TEXT,
  notes_top           TEXT,
  notes_middle        TEXT,
  notes_base          TEXT,
  gender              TEXT CHECK (gender IN ('masculine', 'feminine', 'unisex')),
  concentration       TEXT CHECK (concentration IN ('EDT', 'EDP', 'Parfum', 'Cologne', 'Other')),
  featured_variant_id UUID,  -- FK added after product_variants table exists
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_slug      ON public.products (slug);
CREATE INDEX IF NOT EXISTS idx_products_brand_id  ON public.products (brand_id);
CREATE INDEX IF NOT EXISTS idx_products_active    ON public.products (is_active) WHERE is_active = TRUE;

-- Trigram index for fuzzy search
CREATE INDEX IF NOT EXISTS idx_products_name_trgm
  ON public.products USING gin (name gin_trgm_ops);

COMMENT ON COLUMN public.products.featured_variant_id IS 'The default variant shown on catalog cards (cheapest, most popular, etc).';


-- 2.5  PRODUCT ↔ CATEGORY (many-to-many)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.product_categories (
  product_id    UUID NOT NULL REFERENCES public.products(id)    ON DELETE CASCADE,
  category_id   UUID NOT NULL REFERENCES public.categories(id)  ON DELETE CASCADE,
  PRIMARY KEY (product_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_pc_category ON public.product_categories (category_id);


-- 2.6  PRODUCT VARIANTS (the actual purchasable units)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.product_variants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  product_type  public.product_type NOT NULL,
  size_ml       NUMERIC(8,2) NOT NULL CHECK (size_ml > 0),
  price         NUMERIC(12,2) NOT NULL CHECK (price > 0),
  offer_price   NUMERIC(12,2) CHECK (offer_price IS NULL OR offer_price > 0),
  is_on_offer   BOOLEAN NOT NULL DEFAULT FALSE,
  stock         INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  sku           TEXT NOT NULL UNIQUE,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  position      INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Business rule: offer price must be lower than regular price
  CONSTRAINT chk_offer_price_lower
    CHECK (
      (is_on_offer = FALSE)
      OR (offer_price IS NOT NULL AND offer_price < price)
    ),

  -- Each product can only have one variant per type+size combination
  CONSTRAINT uq_variant_per_product
    UNIQUE (product_id, product_type, size_ml)
);

CREATE INDEX IF NOT EXISTS idx_variants_product_id  ON public.product_variants (product_id);
CREATE INDEX IF NOT EXISTS idx_variants_sku         ON public.product_variants (sku);
CREATE INDEX IF NOT EXISTS idx_variants_stock       ON public.product_variants (stock);
CREATE INDEX IF NOT EXISTS idx_variants_active      ON public.product_variants (is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_variants_offer       ON public.product_variants (is_on_offer) WHERE is_on_offer = TRUE;

-- Now add the deferred FK from products.featured_variant_id
ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS fk_featured_variant;
ALTER TABLE public.products
  ADD CONSTRAINT fk_featured_variant
  FOREIGN KEY (featured_variant_id) REFERENCES public.product_variants(id)
  ON DELETE SET NULL;


-- 2.7  PRODUCT IMAGES
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.product_images (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url           TEXT NOT NULL,
  alt_text      TEXT,
  position      INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_images_product_id ON public.product_images (product_id);


-- 2.8  CUSTOMER ADDRESSES
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.addresses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label         TEXT NOT NULL DEFAULT 'Home',
  full_name     TEXT NOT NULL,
  phone         TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city          TEXT NOT NULL,
  province      TEXT NOT NULL,
  postal_code   TEXT,
  country       TEXT NOT NULL DEFAULT 'CR',
  instructions  TEXT,
  is_default    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses (user_id);


-- 2.9  CART ITEMS
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.cart_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  variant_id    UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity      INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_cart_user_variant UNIQUE (user_id, variant_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_user_id ON public.cart_items (user_id);


-- 2.10  ORDERS
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number      BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,
  user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,

  -- Delivery snapshot (immutable copy of address at time of order)
  shipping_full_name    TEXT NOT NULL,
  shipping_phone        TEXT NOT NULL,
  shipping_address_line1 TEXT NOT NULL,
  shipping_address_line2 TEXT,
  shipping_city         TEXT NOT NULL,
  shipping_province     TEXT NOT NULL,
  shipping_postal_code  TEXT,
  shipping_country      TEXT NOT NULL DEFAULT 'CR',
  shipping_instructions TEXT,

  -- Totals
  subtotal          NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0),
  shipping_cost     NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (shipping_cost >= 0),
  tax               NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (tax >= 0),
  discount          NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
  total             NUMERIC(12,2) NOT NULL CHECK (total >= 0),

  status            public.order_status NOT NULL DEFAULT 'pending',
  notes             TEXT,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id     ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status      ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at  ON public.orders (created_at DESC);


-- 2.11  ORDER ITEMS (immutable snapshots)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.order_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  variant_id      UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,

  -- Snapshot fields (preserved even if product/variant changes or is deleted)
  product_name    TEXT NOT NULL,
  brand_name      TEXT NOT NULL,
  product_type    public.product_type NOT NULL,
  size_ml         NUMERIC(8,2) NOT NULL,
  sku             TEXT NOT NULL,

  quantity        INT NOT NULL CHECK (quantity > 0),
  unit_price      NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
  line_total      NUMERIC(12,2) NOT NULL CHECK (line_total >= 0),

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items (order_id);


-- 2.12  STOCK MOVEMENTS (audit log)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.stock_movements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id      UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  previous_stock  INT NOT NULL,
  new_stock       INT NOT NULL,
  delta           INT NOT NULL,  -- positive = increase, negative = decrease
  reason          public.stock_movement_reason NOT NULL,
  reference_id    UUID,          -- optional FK to order or other entity
  notes           TEXT,
  performed_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_mv_variant   ON public.stock_movements (variant_id);
CREATE INDEX IF NOT EXISTS idx_stock_mv_created   ON public.stock_movements (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_mv_reason    ON public.stock_movements (reason);


-- ────────────────────────────────────────────────────────────────────────────
-- 3. HELPER FUNCTIONS
-- ────────────────────────────────────────────────────────────────────────────

-- 3.1  Check if current user is admin
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;


-- 3.2  Auto-update `updated_at` trigger function
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


-- 3.3  Auto-create profile on signup
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', ''),
    'customer'
  );
  RETURN NEW;
END;
$$;


-- 3.4  Record stock movement when variant stock changes
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.log_stock_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.stock IS DISTINCT FROM NEW.stock THEN
    INSERT INTO public.stock_movements (
      variant_id, previous_stock, new_stock, delta, reason, performed_by
    ) VALUES (
      NEW.id,
      OLD.stock,
      NEW.stock,
      NEW.stock - OLD.stock,
      'manual_adjustment',
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$;


-- 3.5  Decrease stock when order item is inserted
--      (Called from the place_order function — not a direct trigger)
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.decrease_variant_stock(
  p_variant_id  UUID,
  p_quantity    INT,
  p_order_id    UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_stock INT;
BEGIN
  -- Lock the row to prevent race conditions
  SELECT stock INTO v_current_stock
  FROM public.product_variants
  WHERE id = p_variant_id
  FOR UPDATE;

  IF v_current_stock IS NULL THEN
    RAISE EXCEPTION 'Variant % does not exist.', p_variant_id;
  END IF;

  IF v_current_stock < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock for variant %. Available: %, requested: %.',
      p_variant_id, v_current_stock, p_quantity;
  END IF;

  -- Update stock
  UPDATE public.product_variants
  SET stock = stock - p_quantity
  WHERE id = p_variant_id;

  -- Log the movement (bypass the manual_adjustment trigger via direct insert)
  INSERT INTO public.stock_movements (
    variant_id, previous_stock, new_stock, delta, reason, reference_id, performed_by
  ) VALUES (
    p_variant_id,
    v_current_stock,
    v_current_stock - p_quantity,
    -p_quantity,
    'order_placed',
    p_order_id,
    auth.uid()
  );
END;
$$;


-- 3.6  PLACE ORDER — atomic transaction
-- ────────────────────────────────────────────────────────────────────────────
-- Creates the order, snapshots items, decreases stock, clears the cart.

CREATE OR REPLACE FUNCTION public.place_order(
  p_address_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id       UUID := auth.uid();
  v_order_id      UUID;
  v_subtotal      NUMERIC(12,2) := 0;
  v_address       RECORD;
  v_item          RECORD;
  v_effective_price NUMERIC(12,2);
  v_line_total    NUMERIC(12,2);
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to place an order.';
  END IF;

  -- Fetch the delivery address
  SELECT * INTO v_address
  FROM public.addresses
  WHERE id = p_address_id AND user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Address not found or does not belong to user.';
  END IF;

  -- Create the order shell
  INSERT INTO public.orders (
    user_id,
    shipping_full_name, shipping_phone,
    shipping_address_line1, shipping_address_line2,
    shipping_city, shipping_province, shipping_postal_code,
    shipping_country, shipping_instructions,
    subtotal, total, status
  ) VALUES (
    v_user_id,
    v_address.full_name, v_address.phone,
    v_address.address_line1, v_address.address_line2,
    v_address.city, v_address.province, v_address.postal_code,
    v_address.country, v_address.instructions,
    0, 0, 'pending'
  )
  RETURNING id INTO v_order_id;

  -- Iterate cart items, create order_items, decrease stock
  FOR v_item IN
    SELECT
      ci.variant_id,
      ci.quantity,
      pv.price,
      pv.offer_price,
      pv.is_on_offer,
      pv.product_type,
      pv.size_ml,
      pv.sku,
      p.name   AS product_name,
      b.name   AS brand_name
    FROM public.cart_items ci
    JOIN public.product_variants pv ON pv.id = ci.variant_id
    JOIN public.products p          ON p.id  = pv.product_id
    JOIN public.brands b            ON b.id  = p.brand_id
    WHERE ci.user_id = v_user_id
  LOOP
    -- Determine effective price
    IF v_item.is_on_offer AND v_item.offer_price IS NOT NULL THEN
      v_effective_price := v_item.offer_price;
    ELSE
      v_effective_price := v_item.price;
    END IF;

    v_line_total := v_effective_price * v_item.quantity;
    v_subtotal   := v_subtotal + v_line_total;

    -- Snapshot order item
    INSERT INTO public.order_items (
      order_id, variant_id,
      product_name, brand_name, product_type, size_ml, sku,
      quantity, unit_price, line_total
    ) VALUES (
      v_order_id, v_item.variant_id,
      v_item.product_name, v_item.brand_name, v_item.product_type,
      v_item.size_ml, v_item.sku,
      v_item.quantity, v_effective_price, v_line_total
    );

    -- Decrease stock (will raise if insufficient)
    PERFORM public.decrease_variant_stock(v_item.variant_id, v_item.quantity, v_order_id);
  END LOOP;

  IF v_subtotal = 0 THEN
    RAISE EXCEPTION 'Cart is empty — cannot place an order.';
  END IF;

  -- Finalize totals
  UPDATE public.orders
  SET subtotal = v_subtotal,
      total    = v_subtotal   -- extend later: + shipping - discount + tax
  WHERE id = v_order_id;

  -- Clear the cart
  DELETE FROM public.cart_items WHERE user_id = v_user_id;

  RETURN v_order_id;
END;
$$;


-- 3.7  SEARCH PRODUCTS — fuzzy trigram search
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.search_products(
  p_query   TEXT,
  p_limit   INT DEFAULT 20,
  p_offset  INT DEFAULT 0
)
RETURNS TABLE (
  id          UUID,
  name        TEXT,
  slug        TEXT,
  brand_name  TEXT,
  similarity  REAL
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT
    p.id,
    p.name,
    p.slug,
    b.name AS brand_name,
    similarity(p.name, p_query) AS similarity
  FROM public.products p
  JOIN public.brands b ON b.id = p.brand_id
  WHERE p.is_active = TRUE
    AND (
      p.name % p_query                    -- trigram match on product name
      OR b.name % p_query                 -- trigram match on brand name
      OR p.name ILIKE '%' || p_query || '%'
      OR b.name ILIKE '%' || p_query || '%'
    )
  ORDER BY similarity DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;


-- 3.8  ANALYTICS HELPERS
-- ────────────────────────────────────────────────────────────────────────────

-- Best-selling variants (by units sold)
CREATE OR REPLACE FUNCTION public.analytics_best_sellers(
  p_limit INT DEFAULT 10,
  p_since TIMESTAMPTZ DEFAULT now() - INTERVAL '30 days'
)
RETURNS TABLE (
  variant_id    UUID,
  product_name  TEXT,
  brand_name    TEXT,
  product_type  public.product_type,
  size_ml       NUMERIC,
  sku           TEXT,
  total_units   BIGINT,
  total_revenue NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    oi.variant_id,
    oi.product_name,
    oi.brand_name,
    oi.product_type,
    oi.size_ml,
    oi.sku,
    SUM(oi.quantity)::BIGINT    AS total_units,
    SUM(oi.line_total)          AS total_revenue
  FROM public.order_items oi
  JOIN public.orders o ON o.id = oi.order_id
  WHERE o.status NOT IN ('denied')
    AND o.created_at >= p_since
  GROUP BY oi.variant_id, oi.product_name, oi.brand_name,
           oi.product_type, oi.size_ml, oi.sku
  ORDER BY total_units DESC
  LIMIT p_limit;
$$;

-- Revenue summary
CREATE OR REPLACE FUNCTION public.analytics_revenue_summary(
  p_since TIMESTAMPTZ DEFAULT now() - INTERVAL '30 days'
)
RETURNS TABLE (
  total_orders    BIGINT,
  gross_revenue   NUMERIC,
  total_units     BIGINT,
  avg_order_value NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COUNT(*)::BIGINT                          AS total_orders,
    COALESCE(SUM(total), 0)                   AS gross_revenue,
    COALESCE(SUM(s.units), 0)::BIGINT         AS total_units,
    COALESCE(AVG(total), 0)                   AS avg_order_value
  FROM public.orders o
  LEFT JOIN LATERAL (
    SELECT SUM(quantity) AS units FROM public.order_items WHERE order_id = o.id
  ) s ON TRUE
  WHERE o.status NOT IN ('denied')
    AND o.created_at >= p_since;
$$;

-- Low stock alerts
CREATE OR REPLACE FUNCTION public.analytics_low_stock(
  p_threshold INT DEFAULT 5
)
RETURNS TABLE (
  variant_id   UUID,
  product_name TEXT,
  sku          TEXT,
  stock        INT,
  product_type public.product_type,
  size_ml      NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    pv.id         AS variant_id,
    p.name        AS product_name,
    pv.sku,
    pv.stock,
    pv.product_type,
    pv.size_ml
  FROM public.product_variants pv
  JOIN public.products p ON p.id = pv.product_id
  WHERE pv.is_active = TRUE
    AND pv.stock <= p_threshold
  ORDER BY pv.stock ASC;
$$;


-- ────────────────────────────────────────────────────────────────────────────
-- 4. TRIGGERS
-- ────────────────────────────────────────────────────────────────────────────

-- 4.1  updated_at triggers
DO $$ BEGIN
  CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER set_brands_updated_at
    BEFORE UPDATE ON public.brands
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER set_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER set_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER set_variants_updated_at
    BEFORE UPDATE ON public.product_variants
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER set_addresses_updated_at
    BEFORE UPDATE ON public.addresses
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER set_cart_items_updated_at
    BEFORE UPDATE ON public.cart_items
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER set_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4.2  Auto-create profile on auth signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4.3  Stock change audit (for manual admin edits via UPDATE)
DO $$ BEGIN
  CREATE TRIGGER on_variant_stock_change
    AFTER UPDATE OF stock ON public.product_variants
    FOR EACH ROW
    WHEN (OLD.stock IS DISTINCT FROM NEW.stock)
    EXECUTE FUNCTION public.log_stock_change();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ────────────────────────────────────────────────────────────────────────────
-- 5. ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────────────────────

-- Enable RLS on all tables
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements   ENABLE ROW LEVEL SECURITY;


-- ── PROFILES ──────────────────────────────────────────────────────────────

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());


-- ── BRANDS ────────────────────────────────────────────────────────────────

CREATE POLICY "Anyone can view active brands"
  ON public.brands FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Admins can view all brands"
  ON public.brands FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can manage brands"
  ON public.brands FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ── CATEGORIES ────────────────────────────────────────────────────────────

CREATE POLICY "Anyone can view active categories"
  ON public.categories FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Admins can view all categories"
  ON public.categories FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can manage categories"
  ON public.categories FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ── PRODUCTS ──────────────────────────────────────────────────────────────

CREATE POLICY "Anyone can view active products"
  ON public.products FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Admins can view all products"
  ON public.products FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can manage products"
  ON public.products FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ── PRODUCT_CATEGORIES ───────────────────────────────────────────────────

CREATE POLICY "Anyone can view product categories"
  ON public.product_categories FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins can manage product categories"
  ON public.product_categories FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ── PRODUCT_VARIANTS ─────────────────────────────────────────────────────

CREATE POLICY "Anyone can view active variants"
  ON public.product_variants FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Admins can view all variants"
  ON public.product_variants FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can manage variants"
  ON public.product_variants FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ── PRODUCT_IMAGES ───────────────────────────────────────────────────────

CREATE POLICY "Anyone can view product images"
  ON public.product_images FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins can manage product images"
  ON public.product_images FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ── ADDRESSES ─────────────────────────────────────────────────────────────

CREATE POLICY "Users can manage own addresses"
  ON public.addresses FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all addresses"
  ON public.addresses FOR SELECT
  USING (public.is_admin());


-- ── CART_ITEMS ─────────────────────────────────────────────────────────────

CREATE POLICY "Users can manage own cart"
  ON public.cart_items FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ── ORDERS ────────────────────────────────────────────────────────────────

CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders"
  ON public.orders FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update orders"
  ON public.orders FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ── ORDER_ITEMS ───────────────────────────────────────────────────────────

CREATE POLICY "Users can view own order items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all order items"
  ON public.order_items FOR SELECT
  USING (public.is_admin());


-- ── STOCK_MOVEMENTS ──────────────────────────────────────────────────────

CREATE POLICY "Admins can view stock movements"
  ON public.stock_movements FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can insert stock movements"
  ON public.stock_movements FOR INSERT
  WITH CHECK (public.is_admin());


-- ────────────────────────────────────────────────────────────────────────────
-- 6. STORAGE BUCKETS
-- ────────────────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('product-images', 'product-images', TRUE),
  ('brand-logos',    'brand-logos',    TRUE),
  ('avatars',        'avatars',        FALSE)
ON CONFLICT (id) DO NOTHING;

-- Public read for product images and brand logos
CREATE POLICY "Public read product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "Public read brand logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'brand-logos');

-- Admins can upload product images and brand logos
CREATE POLICY "Admins upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

CREATE POLICY "Admins manage product images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'product-images' AND public.is_admin());

CREATE POLICY "Admins delete product images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images' AND public.is_admin());

CREATE POLICY "Admins upload brand logos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'brand-logos' AND public.is_admin());

-- Users can manage their own avatars
CREATE POLICY "Users upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY "Users read own avatar"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY "Users update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );


-- ────────────────────────────────────────────────────────────────────────────
-- 7. SEED DATA (optional — remove in production)
-- ────────────────────────────────────────────────────────────────────────────

-- Example brands
INSERT INTO public.brands (name, slug) VALUES
  ('Chanel',       'chanel'),
  ('Dior',         'dior'),
  ('Tom Ford',     'tom-ford'),
  ('Creed',        'creed'),
  ('Lattafa',      'lattafa'),
  ('Armaf',        'armaf'),
  ('Versace',      'versace'),
  ('Paco Rabanne', 'paco-rabanne')
ON CONFLICT (slug) DO NOTHING;

-- Example categories
INSERT INTO public.categories (name, slug, position) VALUES
  ('Hombre',     'hombre',     1),
  ('Mujer',      'mujer',      2),
  ('Unisex',     'unisex',     3),
  ('Árabe',      'arabe',      4),
  ('Nicho',      'nicho',      5),
  ('Diseñador',  'disenador',  6),
  ('Decant',     'decant',     7)
ON CONFLICT (slug) DO NOTHING;


-- ════════════════════════════════════════════════════════════════════════════
-- END OF MIGRATION
-- ════════════════════════════════════════════════════════════════════════════