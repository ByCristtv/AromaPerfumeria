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
 * Categories embed needs `!inner` when we filter by category so
 * PostgREST actually drops parent rows that don't match. Without a
 * category filter we left-join (no `!inner`) so products without
 * categories still appear in the catalog.
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

/**
 * Base active-products query with an exact count, so the caller can
 * derive `hasNextPage` precisely instead of guessing from page size.
 */
function buildBaseQuery(filterByCategory: boolean) {
  return supabase
    .from("products")
    .select(buildSelect(filterByCategory), { count: "exact" })
    .eq("is_active", true);
}

/**
 * Resolve the product IDs matching a free-text query via the
 * trigram/ILIKE `search_products` RPC. Returns `null` when there is
 * no query (caller skips the `.in()` narrowing entirely).
 */
async function resolveSearchIds(query?: string): Promise<string[] | null> {
  if (!query) return null;

  const { data } = await supabase.rpc("search_products", {
    p_query: query,
    p_limit: SEARCH_CANDIDATE_CAP,
  });

  return ((data ?? []) as { id: string }[]).map((hit) => hit.id);
}

/** Apply the active filters (search IDs + category) to the query. */
function applyFilters(
  query: CatalogQuery,
  filters: ProductFilters | undefined,
  searchIds: string[] | null
): CatalogQuery {
  let next = query;

  if (searchIds) {
    next = next.in("id", searchIds);
  }

  if (filters?.category) {
    // categories!inner makes this prune parent rows, not just the
    // embedded array. We filter by id because names are display-only.
    next = next.eq("categories.id", filters.category);
  }

  return next;
}

/** Apply ordering. Falls back to newest-first when unspecified. */
function applyOrder(query: CatalogQuery, orderBy: ProductFilters["orderBy"]): CatalogQuery {
  switch (orderBy) {
    case "price_asc":
      // PostgREST orders parent rows by an embedded column using
      // `alias(column)` inside the column argument; `referencedTable`
      // would only reorder inside the to-one embed (a no-op here).
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
 * @param page  Zero-based page index.
 * @param pageSize  Items per page.
 * @param filters  Optional category / order / search filters.
 *
 * Edge cases handled: an empty search resolves to zero results without
 * a round-trip; a page past the end returns `[]` with `nextPage: null`;
 * any PostgREST error degrades to an empty terminal page.
 */
export async function getProductsPage(
  page: number,
  pageSize: number = PRODUCTS_PAGE_SIZE,
  filters?: ProductFilters
): Promise<ProductPage> {
  const searchIds = await resolveSearchIds(filters?.query);

  // A non-null but empty search means "queried, matched nothing".
  if (searchIds !== null && searchIds.length === 0) {
    return { items: [], nextPage: null, total: 0 };
  }

  const from = page * pageSize;
  const to = from + pageSize - 1;

  let query = buildBaseQuery(!!filters?.category);
  query = applyFilters(query, filters, searchIds);
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
