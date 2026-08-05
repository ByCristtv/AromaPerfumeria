import { uploadProductImage } from "@/services/uploadProductImage";
import { supabase } from "@/lib/supabase/client";
import type { ProductTypes } from "@/types/product";
import type { CreateProductDTO, CreateVariantDTO } from "@/types/product";

/**
 * Create a new product together with its initial commercial variant.
 *
 * Delegates to the `create_new_product` Postgres RPC, which inserts
 * into `products`, `product_categories`, and `product_variants`
 * atomically.
 */
export async function createProduct(formData: CreateProductDTO) {
  const imageUrl = await uploadProductImage(formData.file);

  const { data, error } = await supabase.rpc("create_new_product", {
    p_name: formData.name,
    p_brand_id: formData.brand_id,
    p_description: formData.description,
    p_notes_top: formData.notes_top,
    p_notes_middle: formData.notes_middle,
    p_notes_base: formData.notes_base,
    p_gender: formData.gender,
    p_concentration: formData.concentration,
    p_image_url: imageUrl,
    p_category_ids: formData.category_ids,
    p_sku: formData.sku,
    p_price: formData.price,
    p_stock: formData.stock,
    p_size_ml: formData.size_ml,
    p_product_type: formData.product_type,
    p_is_on_offer: formData.is_on_offer,
    p_offer_price: formData.is_on_offer && formData.offer_price !== null
      ? Number(formData.offer_price)
      : undefined,
  });

  if (error) throw error;

  // `create_new_product` predates the wholesale columns and takes no wholesale
  // params, so persist them in a follow-up update on the just-created variant,
  // located by its unique SKU. Only runs when at least one value was provided,
  // leaving retail-only creation completely unchanged.
  if (
    formData.wholesale_price !== null ||
    formData.min_wholesale_quantity !== null
  ) {
    const { error: wholesaleError } = await supabase
      .from("product_variants")
      .update({
        wholesale_price: formData.wholesale_price,
        min_wholesale_quantity: formData.min_wholesale_quantity,
      })
      .eq("sku", formData.sku);

    if (wholesaleError) throw wholesaleError;
  }

  return data;
}

/**
 * Add another commercial variant (e.g. a 50ml decant) to an existing
 * product. Most fields mirror the `product_variants` table.
 *
 * Variants no longer carry their own image — images belong to the parent
 * product (`product_images`). A variant stores only commercial attributes.
 */
export async function createVariant(variantData: CreateVariantDTO) {
  const { data, error } = await supabase
    .from("product_variants")
    .insert({
      product_id: variantData.product_id,
      sku: variantData.sku,
      price: variantData.price,
      stock: variantData.stock,
      size_ml: variantData.size_ml,
      product_type: variantData.product_type as ProductTypes,
      is_on_offer: variantData.is_on_offer,
      offer_price: variantData.offer_price,
      wholesale_price: variantData.wholesale_price,
      min_wholesale_quantity: variantData.min_wholesale_quantity,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
