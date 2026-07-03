-- ============================================================================
-- 20260628000100_admin_stock_panel.sql
-- Admin "Movimientos de Stock" panel (Task 3) + Bulk stock registration (Task 4).
--
--   1. admin_list_stock_movements(p_search, p_limit, p_offset) — paginated,
--      searchable, name-resolved feed of every inventory movement. The base
--      table only stores variant_id / product_id, so the JOINs here resolve the
--      human-readable product / brand / sku names ONCE in SQL (no N+1 from the
--      app). Search is partial + case-insensitive (ILIKE) over product name,
--      brand and sku. Ships a window-function total_count so the UI can paginate
--      without a second round-trip.
--
--   2. register_bulk_stock(p_payload) — atomically applies an incoming-stock
--      batch to many variants in ONE transaction. Per row it locks the variant,
--      snapshots previous→new stock, updates it, and writes a semantic 'restock'
--      stock_movements row. Decants are rejected (their liquid lives in the
--      products.decant_stock_ml pool, not variant.stock).
--
-- Both are SECURITY DEFINER + is_admin()-gated + revoked from PUBLIC, matching
-- the existing admin RPC convention (see 20260525000700_admin_order_rpcs.sql).
-- ============================================================================
-- Depends on: is_admin(), log_stock_change() skip flag (20260525000600),
--             stock_movements dual-mode columns (20260609000100).
-- ============================================================================


-- ────────────────────────────────────────────────────────────────────────────
-- 1. admin_list_stock_movements(p_search, p_limit, p_offset)
-- ────────────────────────────────────────────────────────────────────────────
-- Returns newest-first. Resolves names for BOTH movement kinds:
--   • variant moves (variant_id set)  → that variant's product / sku / size
--   • pool moves    (product_id set)  → the parent product (sku/size NULL)
-- total_count is the full match count BEFORE LIMIT/OFFSET (same on every row).

CREATE OR REPLACE FUNCTION public.admin_list_stock_movements(
  p_search TEXT DEFAULT NULL,
  p_limit  INT  DEFAULT 10,
  p_offset INT  DEFAULT 0
) RETURNS TABLE (
  id                UUID,
  created_at        TIMESTAMPTZ,
  reason            public.stock_movement_reason,
  variant_id        UUID,
  product_id        UUID,
  previous_stock    INT,
  new_stock         INT,
  delta             INT,
  previous_ml       NUMERIC,
  new_ml            NUMERIC,
  ml_delta          NUMERIC,
  notes             TEXT,
  sku               TEXT,
  size_ml           NUMERIC,
  product_type      public.product_type,
  product_name      TEXT,
  brand_name        TEXT,
  performed_by_name TEXT,
  total_count       BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_search TEXT := NULLIF(TRIM(p_search), '');
  v_like   TEXT;
  v_limit  INT  := LEAST(GREATEST(COALESCE(p_limit, 10), 1), 100);
  v_offset INT  := GREATEST(COALESCE(p_offset, 0), 0);
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Insufficient privilege: admin only.';
  END IF;

  -- Escape LIKE metacharacters so a search for "50%" is literal, not a wildcard.
  v_like := '%' || replace(replace(replace(v_search, '\', '\\'), '%', '\%'), '_', '\_') || '%';

  RETURN QUERY
  SELECT
    sm.id,
    sm.created_at,
    sm.reason,
    sm.variant_id,
    COALESCE(pv.product_id, sm.product_id)        AS product_id,
    sm.previous_stock,
    sm.new_stock,
    sm.delta,
    sm.previous_ml,
    sm.new_ml,
    sm.ml_delta,
    sm.notes,
    pv.sku,
    pv.size_ml,
    pv.product_type,
    p.name                                        AS product_name,
    b.name                                        AS brand_name,
    prof.full_name                                AS performed_by_name,
    COUNT(*) OVER()                               AS total_count
  FROM public.stock_movements sm
  LEFT JOIN public.product_variants pv ON pv.id = sm.variant_id
  LEFT JOIN public.products         p  ON p.id  = COALESCE(pv.product_id, sm.product_id)
  LEFT JOIN public.brands           b  ON b.id  = p.brand_id
  LEFT JOIN public.profiles         prof ON prof.id = sm.performed_by
  WHERE
    v_search IS NULL
    OR p.name  ILIKE v_like ESCAPE '\'
    OR b.name  ILIKE v_like ESCAPE '\'
    OR pv.sku  ILIKE v_like ESCAPE '\'
  ORDER BY sm.created_at DESC, sm.id DESC
  LIMIT v_limit OFFSET v_offset;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_list_stock_movements(TEXT, INT, INT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.admin_list_stock_movements(TEXT, INT, INT) TO authenticated;


-- ────────────────────────────────────────────────────────────────────────────
-- 2. register_bulk_stock(p_payload JSONB) → JSONB
-- ────────────────────────────────────────────────────────────────────────────
-- INPUT:
--   { "items": [ { "variant_id": uuid, "quantity": int>0 }, ... ],
--     "notes": string? }
-- OUTPUT: { processed, total_added }
--
-- The whole batch runs in the function's single transaction: if ANY row fails
-- (missing variant, decant, bad quantity) the entire batch rolls back — stock
-- and the ledger can never desynchronise.

CREATE OR REPLACE FUNCTION public.register_bulk_stock(
  p_payload JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor       UUID := auth.uid();
  v_items       JSONB;
  v_item        JSONB;
  v_variant_id  UUID;
  v_quantity    INT;
  v_notes       TEXT;
  v_variant     RECORD;
  v_processed   INT := 0;
  v_total_added INT := 0;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Insufficient privilege: admin only.';
  END IF;
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'No authenticated admin; cannot attribute the movement.';
  END IF;

  v_notes := NULLIF(TRIM(p_payload->>'notes'), '');
  v_items := p_payload->'items';
  IF v_items IS NULL
     OR jsonb_typeof(v_items) <> 'array'
     OR jsonb_array_length(v_items) = 0 THEN
    RAISE EXCEPTION 'items must be a non-empty array';
  END IF;

  -- We write semantic 'restock' rows ourselves → suppress the trigger's
  -- auto 'manual_adjustment' log for every UPDATE in this transaction.
  PERFORM set_config('app.skip_stock_audit', '1', true);

  FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
  LOOP
    v_variant_id := (v_item->>'variant_id')::UUID;
    v_quantity   := (v_item->>'quantity')::INT;

    IF v_variant_id IS NULL THEN
      RAISE EXCEPTION 'items[].variant_id is required';
    END IF;
    IF v_quantity IS NULL OR v_quantity <= 0 THEN
      RAISE EXCEPTION 'items[].quantity must be a positive integer';
    END IF;

    -- Lock the row so a concurrent order/restock can't race the snapshot.
    SELECT id, product_type, stock, sku
      INTO v_variant
      FROM public.product_variants
     WHERE id = v_variant_id
       FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Variant % does not exist.', v_variant_id;
    END IF;
    IF v_variant.product_type = 'decant' THEN
      RAISE EXCEPTION
        'Variant % is a decant; its liquid is tracked in the decant pool, not bulk stock.',
        v_variant.sku;
    END IF;

    UPDATE public.product_variants
       SET stock = stock + v_quantity
     WHERE id = v_variant_id;

    INSERT INTO public.stock_movements (
      variant_id, previous_stock, new_stock, delta, reason, notes, performed_by
    ) VALUES (
      v_variant_id,
      v_variant.stock,
      v_variant.stock + v_quantity,
      v_quantity,
      'restock',
      v_notes,
      v_actor
    );

    v_processed   := v_processed + 1;
    v_total_added := v_total_added + v_quantity;
  END LOOP;

  RETURN jsonb_build_object(
    'processed',   v_processed,
    'total_added', v_total_added
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.register_bulk_stock(JSONB) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.register_bulk_stock(JSONB) TO authenticated;


-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- 1. Functions exist:
--    SELECT proname FROM pg_proc
--     WHERE proname IN ('admin_list_stock_movements','register_bulk_stock');
--
-- 2. Non-admin rejected (run as a normal user):
--    SELECT public.admin_list_stock_movements(NULL, 10, 0);  -- → Insufficient privilege
--
-- 3. Listing (admin session / service_role in Studio):
--    SELECT id, reason, product_name, sku, delta, total_count
--      FROM public.admin_list_stock_movements(NULL, 10, 0);
--    SELECT id, product_name FROM public.admin_list_stock_movements('dior', 10, 0);
--
-- 4. Bulk restock happy path (use a REAL non-decant variant id):
--    SELECT public.register_bulk_stock('{
--      "items": [{"variant_id":"<real-non-decant-variant>","quantity":12}],
--      "notes": "Compra proveedor X"
--    }'::jsonb);
--    → product_variants.stock += 12; one stock_movements row reason='restock';
--      NO extra manual_adjustment row.
--
-- 5. Decant rejected:
--    SELECT public.register_bulk_stock('{"items":[{"variant_id":"<decant>","quantity":1}]}'::jsonb);
--    → ERROR ... is a decant ...
-- ============================================================================
