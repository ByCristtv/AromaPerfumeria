import { supabase } from "@/lib/supabase/client";
import type { ProductCardData } from "@/types/product";
import {
  PRODUCTS_PAGE_SIZE,
  type ProductFilters,
  type ProductPage,
} from "@/types/productFilter";

/**
 * Upper bound on how many search hits we resolve before paginating
 * over them. Search is an inherently narrow result set, so a single
 * generous cap lets the user page through matches without changing
 * the `search_products` RPC contract.
 */
const SEARCH_CANDIDATE_CAP = 200;

type CatalogQuery = ReturnType<typeof buildBaseQuery>;

/**
 * The catalog is PRODUCT-centric: one card per parent perfume, represented by
 * its featured (primary) variant and the parent's first image. Variant choice
 * happens on the detail page, not the catalog.
 *
 * `categories!inner` is only used when filtering by category, so PostgREST
 * prunes products that don't match; otherwise we left-join so uncategorised
 * products still appear.
 */
function buildSelect(filterByCategory: boolean): string {
  const categoriesClause = filterByCategory
    ? `categories!inner ( id, name )`
    : `categories ( id, name )`;

  return `
    id,
    name,
    slug,
    gender,
    concentration,
    decant_stock_ml,
    brands ( name ),
    ${categoriesClause},
    featured_variant:product_variants!fk_featured_variant (
      id,
      price,
      offer_price,
      is_on_offer,
      stock,
      size_ml,
      product_type
    ),
    product_images ( url, position )
  `;
}

/** Active-products base query with an exact count for precise pagination. */
function buildBaseQuery(filterByCategory: boolean) {
  return supabase
    .from("products")
    .select(buildSelect(filterByCategory), { count: "exact" })
    .eq("is_active", true);
}

/**
 * Resolve product IDs matching a free-text query via the trigram/ILIKE
 * `search_products` RPC. Returns `null` when there is no query.
 */
async function resolveSearchIds(query?: string): Promise<string[] | null> {
  if (!query) return null;

  const { data } = await supabase.rpc("search_products", {
    p_query: query,
    p_limit: SEARCH_CANDIDATE_CAP,
  });

  return ((data ?? []) as { id: string }[]).map((hit) => hit.id);
}

/**
 * Resolve IDs of products that have at least one active variant of the given
 * `product_type`. Lets the (product-centric) catalog keep the type filter —
 * "show perfumes available as decants/sets". Returns `null` when not filtering.
 */
async function resolveTypeIds(
  productType?: ProductFilters["productType"]
): Promise<string[] | null> {
  if (!productType) return null;

  const { data } = await supabase
    .from("product_variants")
    .select("product_id")
    .eq("product_type", productType)
    .eq("is_active", true);

  return [...new Set(((data ?? []) as { product_id: string }[]).map((r) => r.product_id))];
}

/** Apply the active filters. Both id-list filters AND together (intersection). */
function applyFilters(
  query: CatalogQuery,
  filters: ProductFilters | undefined,
  searchIds: string[] | null,
  typeIds: string[] | null
): CatalogQuery {
  let next = query;

  if (searchIds) next = next.in("id", searchIds);
  if (typeIds) next = next.in("id", typeIds);

  if (filters?.category) {
    // categories!inner makes this prune parent rows, not just the embedded array.
    next = next.eq("categories.id", filters.category);
  }

  return next;
}

/** Apply ordering. Falls back to newest-first when unspecified. */
function applyOrder(query: CatalogQuery, orderBy: ProductFilters["orderBy"]): CatalogQuery {
  switch (orderBy) {
    case "price_asc":
      // Order parent rows by the to-one featured variant's price.
      return query.order("featured_variant(price)", { ascending: true });
    case "price_desc":
      return query.order("featured_variant(price)", { ascending: false });
    case "name_asc":
      return query.order("name", { ascending: true });
    case "name_desc":
      return query.order("name", { ascending: false });
    default:
      return query.order("created_at", { ascending: false });
  }
}

/**
 * Fetch a single page of catalog products (offset-based pagination).
 *
 * One card per parent product. Edge cases: an empty search/type resolves to
 * zero results without a round-trip; a page past the end returns `[]` with
 * `nextPage: null`; any PostgREST error degrades to an empty terminal page.
 */
export async function getProductsPage(
  page: number,
  pageSize: number = PRODUCTS_PAGE_SIZE,
  filters?: ProductFilters
): Promise<ProductPage> {
  const [searchIds, typeIds] = await Promise.all([
    resolveSearchIds(filters?.query),
    resolveTypeIds(filters?.productType),
  ]);

  // A non-null but empty id-list means "filtered, matched nothing".
  if (
    (searchIds !== null && searchIds.length === 0) ||
    (typeIds !== null && typeIds.length === 0)
  ) {
    return { items: [], nextPage: null, total: 0 };
  }

  const from = page * pageSize;
  const to = from + pageSize - 1;

  let query = buildBaseQuery(!!filters?.category);
  query = applyFilters(query, filters, searchIds, typeIds);
  query = applyOrder(query, filters?.orderBy);

  const { data, error, count } = await query.range(from, to);

  if (error) {
    console.error("getProductsPage failed:", error.message);
    return { items: [], nextPage: null, total: 0 };
  }

  const items = (data as unknown as ProductCardData[]) ?? [];
  const total = count ?? 0;
  const hasNextPage = from + items.length < total;

  return {
    items,
    nextPage: hasNextPage ? page + 1 : null,
    total,
  };
}
