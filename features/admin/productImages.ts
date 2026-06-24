import { supabase } from "@/lib/supabase/client";
import {
  uploadProductImage,
  deleteProductImageFile,
} from "@/services/uploadProductImage";

/**
 * Parent-product image gallery management. Images belong to the PARENT product
 * (`product_images` with `variant_id IS NULL`) — a product can have several
 * (front, side, box, lifestyle…). Variants no longer have their own images.
 *
 * Orphan prevention: if a DB insert fails after upload, the new file is
 * removed; on delete, the stored file is removed after the row.
 */

export interface ProductImage {
  id: string;
  url: string;
  position: number;
}

/** All parent-level images for a product, ordered for display. */
export async function getProductImages(
  productId: string
): Promise<ProductImage[]> {
  const { data, error } = await supabase
    .from("product_images")
    .select("id, url, position")
    .eq("product_id", productId)
    .is("variant_id", null)
    .order("position", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/** Upload a file and append it as a new parent image. */
export async function addProductImage(
  productId: string,
  file: File
): Promise<ProductImage> {
  const existing = await getProductImages(productId);
  const nextPosition = existing.reduce((max, img) => Math.max(max, img.position), -1) + 1;

  const url = await uploadProductImage(file);

  const { data, error } = await supabase
    .from("product_images")
    .insert({ product_id: productId, variant_id: null, url, position: nextPosition })
    .select("id, url, position")
    .single();

  if (error) {
    // Insert failed — don't leave the just-uploaded file orphaned.
    await deleteProductImageFile(url);
    throw error;
  }
  return data;
}

/** Remove a parent image (row + stored file). */
export async function removeProductImage(image: ProductImage): Promise<void> {
  const { error } = await supabase
    .from("product_images")
    .delete()
    .eq("id", image.id);

  if (error) throw error;
  await deleteProductImageFile(image.url);
}
