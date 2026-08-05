-- ============================================================================
-- 20260804000400  admin_list_product_variants — expose wholesale columns
-- ----------------------------------------------------------------------------
-- Adds wholesale_price + min_wholesale_quantity to the admin Products table RPC
-- so the panel can show them at a glance (see components/admin/ProductListAdmin).
--
-- This RE-adds the whole function from 20260728000200 with two extra output
-- columns. Because the RETURNS TABLE shape changes, CREATE OR REPLACE alone
-- errors ("cannot change return type of existing function"), so we DROP first.
--
-- Everything else (is_admin() gate, search, pagination, total_count) is
-- unchanged. Safe to re-run. After applying, run `pnpm update-types`.
-- ============================================================================

DROP FUNCTION IF EXISTS public.admin_list_product_variants(TEXT, INT, INT);

CREATE OR REPLACE FUNCTION public.admin_list_product_variants(
  p_search TEXT DEFAULT NULL,
  p_limit  INT  DEFAULT 20,
  p_offset INT  DEFAULT 0
) RETURNS TABLE (
  variant_id             UUID,
  product_id             UUID,
  sku                    TEXT,
  size_ml                NUMERIC,
  product_type           public.product_type,
  price                  NUMERIC,
  stock                  INT,
  is_on_offer            BOOLEAN,
  offer_price            NUMERIC,
  is_active              BOOLEAN,
  wholesale_price        NUMERIC,   -- ▼ wholesale
  min_wholesale_quantity INT,       -- ▲ wholesale
  name                   TEXT,
  description            TEXT,
  brand                  TEXT,
  categories             JSONB,
  total_count            BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_search TEXT := NULLIF(TRIM(p_search), '');
  v_like   TEXT;
  v_limit  INT  := LEAST(GREATEST(COALESCE(p_limit, 20), 1), 100);
  v_offset INT  := GREATEST(COALESCE(p_offset, 0), 0);
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Insufficient privilege: admin only.';
  END IF;

  -- Escape LIKE metacharacters so "50%" is literal, not a wildcard.
  v_like := '%' || replace(replace(replace(v_search, '\', '\\'), '%', '\%'), '_', '\_') || '%';

  RETURN QUERY
  SELECT
    pv.id                                          AS variant_id,
    p.id                                           AS product_id,
    pv.sku,
    pv.size_ml,
    pv.product_type,
    pv.price,
    pv.stock,
    pv.is_on_offer,
    pv.offer_price,
    pv.is_active,
    pv.wholesale_price,                            -- ▼ wholesale
    pv.min_wholesale_quantity,                     -- ▲ wholesale
    p.name,
    p.description,
    b.name                                         AS brand,
    COALESCE(
      (
        SELECT jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name) ORDER BY c.name)
          FROM public.product_categories pc
          JOIN public.categories c ON c.id = pc.category_id
         WHERE pc.product_id = p.id
      ),
      '[]'::jsonb
    )                                              AS categories,
    COUNT(*) OVER()                                AS total_count
  FROM public.product_variants pv
  JOIN public.products p ON p.id = pv.product_id
  JOIN public.brands   b ON b.id = p.brand_id
  WHERE
    v_search IS NULL
    OR p.name  ILIKE v_like ESCAPE '\'
    OR b.name  ILIKE v_like ESCAPE '\'
    OR pv.sku  ILIKE v_like ESCAPE '\'
  ORDER BY pv.created_at DESC, pv.id DESC
  LIMIT v_limit OFFSET v_offset;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_list_product_variants(TEXT, INT, INT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.admin_list_product_variants(TEXT, INT, INT) TO authenticated;
