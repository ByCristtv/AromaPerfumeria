import { supabase } from "@/lib/supabase/client";

const BUCKET = "product-images";

/**
 * Upload an image to the `product-images` Supabase Storage bucket
 * and return the public URL. Filenames are namespaced with a UUID
 * to avoid collisions.
 */
export async function uploadProductImage(file: File): Promise<string> {
  const filePath = `${BUCKET}/${crypto.randomUUID()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file);

  if (uploadError) {
    throw new Error(`Image upload failed: ${uploadError.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(filePath);

  return publicUrl;
}

/**
 * Best-effort deletion of a previously uploaded image, given its public URL.
 *
 * Used when replacing or removing a variant image so we don't leave orphaned
 * objects in the bucket. Failures are logged but never thrown — the DB row is
 * the source of truth, and a lingering file is harmless compared to blocking
 * the admin's action.
 */
export async function deleteProductImageFile(publicUrl: string): Promise<void> {
  const marker = `/object/public/${BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return; // Not a URL from our bucket — nothing to delete.

  const objectKey = decodeURIComponent(publicUrl.slice(idx + marker.length));
  const { error } = await supabase.storage.from(BUCKET).remove([objectKey]);
  if (error) {
    console.warn("deleteProductImageFile: could not remove", objectKey, error.message);
  }
}
