import { supabase } from "@/lib/supabase/client";
import type { ProductCardData } from "@/types/product";

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

export interface ProductFilters {
  /** Category UUID. Empty string / undefined means "no filter". */
  category?: string;
  orderBy?: "price_asc" | "price_desc" | "name_asc" | "name_desc";
  query?: string;
}

export async function getProducts(
  limit = 20,
  filters?: ProductFilters
): Promise<ProductCardData[]> {
  const filterByCategory = !!filters?.category;

  let supabaseQuery = supabase
    .from("products")
    .select(buildSelect(filterByCategory))
    .eq("is_active", true);

  if (filters?.query) {
    // Use the search_products RPC which matches against both product
    // name and brand name using trigram similarity + ILIKE. The RPC
    // returns a lightweight result set (id, name, slug, brand_name,
    // similarity). We collect matching IDs and filter the main query
    // with `.in()` to get full ProductCardData with images/variants.
    const { data: searchHits } = await supabase.rpc("search_products", {
      p_query: filters.query,
      p_limit: limit,
    });
    const matchingIds = (searchHits ?? []).map((h: { id: string }) => h.id);
    if (matchingIds.length === 0) return [];
    supabaseQuery = supabaseQuery.in("id", matchingIds);
  }

  if (filterByCategory) {
    // categories!inner makes this filter prune parent rows, not just
    // the embedded category array. We filter by id because names are
    // not unique by contract and are display-only.
    supabaseQuery = supabaseQuery.eq("categories.id", filters!.category!);
  }

  // PostgREST orders parent rows by an embedded column using
  // `alias(column)` *inside* the column argument (see postgrest-js
  // docs). `referencedTable` only reorders items inside the embed,
  // which is a no-op for a to-one relationship.
  switch (filters?.orderBy) {
    case "price_asc":
      supabaseQuery = supabaseQuery.order("featured_variant(price)", {
        ascending: true,
      });
      break;
    case "price_desc":
      supabaseQuery = supabaseQuery.order("featured_variant(price)", {
        ascending: false,
      });
      break;
    case "name_asc":
      supabaseQuery = supabaseQuery.order("name", { ascending: true });
      break;
    case "name_desc":
      supabaseQuery = supabaseQuery.order("name", { ascending: false });
      break;
    default:
      supabaseQuery = supabaseQuery.order("created_at", { ascending: false });
  }

  const { data, error } = await supabaseQuery.limit(limit);

  if (error) {
    console.error("getProducts failed:", error.message);
    return [];
  }

  return (data as unknown as ProductCardData[]) ?? [];
}
