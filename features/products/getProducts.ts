import { supabase } from "@/lib/supabase/client";
import type { ProductCardData } from "@/types/product";

const PRODUCT_CARD_SELECT = `
  id,
  name,
  slug,
  gender,
  concentration,
  brands (
    name
  ),
  featured_variant:product_variants!fk_featured_variant (
    id,
    price,
    offer_price,
    is_on_offer,
    stock,
    size_ml,
    product_type
  ),
  product_images (
    url,
    position
  )
` as const;

/**
 * Fetch the active product catalog for the storefront.
 *
 * The shape of the joined response can't be inferred precisely by
 * the Supabase client generics (deep relational selects, custom FK
 * alias), so we cast through `unknown` once at the boundary. Everything
 * downstream sees `ProductCardData[]`.
 */
export async function getProducts(limit = 20): Promise<ProductCardData[]> {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_CARD_SELECT)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getProducts failed:", error.message);
    return [];
  }

  return (data as ProductCardData[]) ?? [];
}
