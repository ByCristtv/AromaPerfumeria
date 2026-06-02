import { supabase } from "@/lib/supabase/client";
import type { ProductCardData } from "@/types/product";

/**
 * Fetch products that share at least one category with the given product,
 * excluding the product itself. Used for the "También te puede gustar"
 * section on the detail page.
 */
export async function getRelatedProducts(
  productId: string,
  categoryIds: string[],
  limit = 4
): Promise<ProductCardData[]> {
  if (categoryIds.length === 0) return [];

  const { data, error } = await supabase
    .from("products")
    .select(
      `
      id,
      name,
      slug,
      gender,
      concentration,
      brands ( name ),
      categories!inner ( id, name ),
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
    `
    )
    .eq("is_active", true)
    .neq("id", productId)
    .in("categories.id", categoryIds)
    .limit(limit);

  if (error) {
    console.error("getRelatedProducts failed:", error.message);
    return [];
  }

  // Deduplicate (multi-category join may produce dupes) and clamp.
  const seen = new Set<string>();
  const unique: ProductCardData[] = [];
  for (const row of (data as unknown as ProductCardData[]) ?? []) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    unique.push(row);
    if (unique.length >= limit) break;
  }
  return unique;
}
