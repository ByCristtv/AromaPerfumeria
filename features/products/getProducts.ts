import { supabase } from "@/lib/supabase";
import { ProductCardData } from "@/types/product";

export async function getProducts(): Promise<ProductCardData[]> {
  const { data, error } = await supabase
    .from("products")
    .select(`
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
    `)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Error fetching products:", error);
    return [];
  }

  // Supabase devuelve un array, pero TypeScript a veces necesita una ayuda 
  // con el casting de los joins complejos
  return (data as any) ?? [];
}