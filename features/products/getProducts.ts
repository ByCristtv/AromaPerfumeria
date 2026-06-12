import { supabase } from "@/lib/supabase/client";
import type { VariantCardData } from "@/types/product";
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
 * Shape of a single `product_variants` row as fetched for the catalog,
 * with its parent product (and that product's images) embedded.
 */
interface VariantRow {
  id: string;
  price: number;
  offer_price: number | null;
  is_on_offer: boolean;
  stock: number;
  size_ml: number;
  product_type: VariantCardData["product_type"];
  product: {
    id: string;
    name: string;
    slug: string;
    brands: { name: string } | null;
    product_images: { url: string; position: number; variant_id: string | null }[];
  } | null;
}

/**
 * The catalog is now VARIANT-centric: one card per active variant, not
 * per product. We therefore query `product_variants` directly and embed
 * the parent product, which makes price/stock/`product_type` native
 * columns (trivial to order and filter on).
 *
 * Categories embed needs `!inner` when we filter by category so PostgREST
 * actually prunes variants whose product doesn't match. Without a category
 * filter we left-join so variants of uncategorised products still appear.
 */
function buildSelect(filterByCategory: boolean): string {
  const categoriesClause = filterByCategory
    ? `categories!inner ( id )`
    : `categories ( id )`;

 return `
  id,
  price,
  offer_price,
  is_on_offer,
  stock,
  size_ml,
  product_type,
  product:products!product_variants_product_id_fkey!inner (
    id,
    name,
    slug,
    brands ( name ),
    ${categoriesClause},
    product_images ( url, position, variant_id )
  )
`;
}

/**
 * Base query over active variants of active products, with an exact count
 * so the caller can derive `hasNextPage` precisely. `products!inner` is
 * what lets the embedded `product.is_active` filter prune variant rows.
 */
function buildBaseQuery(filterByCategory: boolean) {
  return supabase
    .from("product_variants")
    .select(buildSelect(filterByCategory), { count: "exact" })
    .eq("is_active", true)
    .eq("product.is_active", true);
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

/** Apply the active filters (search IDs + category + product_type). */
function applyFilters(
  query: CatalogQuery,
  filters: ProductFilters | undefined,
  searchIds: string[] | null
): CatalogQuery {
  let next = query;

  if (searchIds) {
    // Search resolves to product IDs; narrow by the variant's parent.
    next = next.in("product_id", searchIds);
  }

  if (filters?.category) {
    // product.categories!inner makes this prune variant rows, not just the
    // embedded array. We filter by id because names are display-only.
    next = next.eq("product.categories.id", filters.category);
  }

  if (filters?.productType) {
    // Native column on product_variants — the fix for "decant"/"set", which
    // are NOT categories but values of product_type.
    next = next.eq("product_type", filters.productType);
  }

  return next;
}

/** Apply ordering. Falls back to newest-first when unspecified. */
function applyOrder(query: CatalogQuery, orderBy: ProductFilters["orderBy"]): CatalogQuery {
  switch (orderBy) {
    case "price_asc":
      // price is now a native column on the variant row.
      return query.order("price", { ascending: true });
    case "price_desc":
      return query.order("price", { ascending: false });
    case "name_asc":
      // Order variant rows by the embedded to-one product's name via the
      // `alias(column)` form PostgREST accepts in the column argument.
      return query.order("product(name)", { ascending: true });
    case "name_desc":
      return query.order("product(name)", { ascending: false });
    default:
      return query.order("created_at", { ascending: false });
  }
}

/**
 * Pick the image that represents a variant: its own image when one exists,
 * otherwise the product's lowest-position (base) image, otherwise null.
 */
function resolveVariantImage(row: VariantRow): string | null {
  const images = row.product?.product_images ?? [];
  const own = images.find((img) => img.variant_id === row.id);
  if (own) return own.url;
  const base = [...images].sort((a, b) => a.position - b.position)[0];
  return base?.url ?? null;
}

/** Flatten a fetched variant row into the catalog card shape. */
function toVariantCard(row: VariantRow): VariantCardData {
  return {
    variantId: row.id,
    productId: row.product?.id ?? "",
    name: row.product?.name ?? "",
    slug: row.product?.slug ?? "",
    brand: row.product?.brands?.name ?? null,
    price: row.price,
    offer_price: row.offer_price,
    is_on_offer: row.is_on_offer,
    stock: row.stock,
    size_ml: row.size_ml,
    product_type: row.product_type,
    imageUrl: resolveVariantImage(row),
  };
}

/**
 * Fetch a single page of catalog variants (offset-based pagination).
 *
 * @param page  Zero-based page index.
 * @param pageSize  Items (variants) per page.
 * @param filters  Optional category / product_type / order / search filters.
 *
 * Note: pagination now counts VARIANTS, not products — a product with three
 * sizes contributes three cards. Edge cases handled: an empty search resolves
 * to zero results without a round-trip; a page past the end returns `[]` with
 * `nextPage: null`; any PostgREST error degrades to an empty terminal page.
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

  const rows = (data as unknown as VariantRow[]) ?? [];
  const items = rows.map(toVariantCard);
  const total = count ?? 0;
  const hasNextPage = from + items.length < total;

  return {
    items,
    nextPage: hasNextPage ? page + 1 : null,
    total,
  };
}
