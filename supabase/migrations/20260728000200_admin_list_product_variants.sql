-- ============================================================================
-- 20260728000200_admin_list_product_variants.sql
-- Server-side pagination + search for the admin Products table.
--
-- WHY
--   /admin/products previously fetched EVERY variant into the client and filtered
--   in memory — it doesn't scale. This RPC returns one page at a time with the
--   exact match count, resolving product / brand / category names in SQL (no N+1),
--   mirroring admin_list_stock_movements (20260628000100).
--
-- SECURITY DEFINER + is_admin()-gated + revoked from PUBLIC, matching the existing
-- admin RPC convention. Search is partial + case-insensitive (ILIKE, metacharacters
-- escaped) over product name, brand name and SKU. total_count is the full match
-- count BEFORE LIMIT/OFFSET (same on every row) so the UI paginates in one round-trip.
-- ============================================================================
-- Depends on: is_admin(), product_variants/products/brands/product_categories/
--             categories tables.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.admin_list_product_variants(
  p_search TEXT DEFAULT NULL,
  p_limit  INT  DEFAULT 20,
  p_offset INT  DEFAULT 0
) RETURNS TABLE (
  variant_id   UUID,
  product_id   UUID,
  sku          TEXT,
  size_ml      NUMERIC,
  product_type public.product_type,
  price        NUMERIC,
  stock        INT,
  is_on_offer  BOOLEAN,
  offer_price  NUMERIC,
  is_active    BOOLEAN,
  name         TEXT,
  description  TEXT,
  brand        TEXT,
  categories   JSONB,
  total_count  BIGINT
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


-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- 1. Function exists:
--    SELECT proname FROM pg_proc WHERE proname = 'admin_list_product_variants';
--
-- 2. Non-admin rejected (run as a normal user): → Insufficient privilege
--    SELECT public.admin_list_product_variants(NULL, 20, 0);
--
-- 3. First page (admin session / service_role in Studio):
--    SELECT variant_id, name, brand, sku, product_type, total_count
--      FROM public.admin_list_product_variants(NULL, 20, 0);
--
-- 4. Search by name / brand / sku:
--    SELECT variant_id, name, brand, categories FROM public.admin_list_product_variants('dior', 20, 0);
-- ============================================================================
