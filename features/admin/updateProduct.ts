import { supabase } from "@/lib/supabase/client";
import type { ProductTypes } from "@/types/product";

export interface UpdateProductPayload {
  product_id: string;
  variant_id: string;
  // Product fields
  name: string;
  brand_id: string;
  description: string;
  notes_top: string;
  notes_middle: string;
  notes_base: string;
  gender: string;
  concentration: string;
  category_ids: string[];
  // Variant fields
  sku: string;
  price: number;
  stock: number;
  size_ml: number;
  product_type: ProductTypes;
  is_on_offer: boolean;
  offer_price: number | null;
  is_active: boolean;
}

/**
 * Update an existing product and its variant.
 *
 * Updates the `products` table row and the `product_variants` row,
 * then syncs `product_categories` by deleting the old set and
 * re-inserting the new one.
 */
export async function updateProduct(payload: UpdateProductPayload) {
  // 1. Update the product row
  const { error: productError } = await supabase
    .from("products")
    .update({
      name: payload.name,
      brand_id: payload.brand_id,
      description: payload.description,
      notes_top: payload.notes_top,
      notes_middle: payload.notes_middle,
      notes_base: payload.notes_base,
      gender: payload.gender,
      concentration: payload.concentration,
    })
    .eq("id", payload.product_id);

  if (productError) throw productError;

  // 2. Update the variant row
  const { error: variantError } = await supabase
    .from("product_variants")
    .update({
      sku: payload.sku,
      price: payload.price,
      stock: payload.stock,
      size_ml: payload.size_ml,
      product_type: payload.product_type,
      is_on_offer: payload.is_on_offer,
      offer_price: payload.is_on_offer ? payload.offer_price : null,
      is_active: payload.is_active,
    })
    .eq("id", payload.variant_id);

  if (variantError) throw variantError;

  // 3. Sync categories: delete old, insert new
  const { error: deleteError } = await supabase
    .from("product_categories")
    .delete()
    .eq("product_id", payload.product_id);

  if (deleteError) throw deleteError;

  if (payload.category_ids.length > 0) {
    const { error: insertError } = await supabase
      .from("product_categories")
      .insert(
        payload.category_ids.map((category_id) => ({
          product_id: payload.product_id,
          category_id,
        }))
      );

    if (insertError) throw insertError;
  }
}

/**
 * Fetch the full product data needed to populate the edit form.
 * AdminVariantRow doesn't carry brand_id, gender, concentration, or notes,
 * so we fetch them separately here.
 */
export async function getProductForEdit(productId: string, variantId: string) {
  const [productRes, variantRes, categoriesRes] = await Promise.all([
    supabase.from("products").select("*").eq("id", productId).single(),
    supabase.from("product_variants").select("*").eq("id", variantId).single(),
    supabase
      .from("product_categories")
      .select("category_id")
      .eq("product_id", productId),
  ]);

  if (productRes.error) throw productRes.error;
  if (variantRes.error) throw variantRes.error;
  if (categoriesRes.error) throw categoriesRes.error;

  return {
    product: productRes.data,
    variant: variantRes.data,
    category_ids: (categoriesRes.data ?? []).map((c) => c.category_id),
  };
}
