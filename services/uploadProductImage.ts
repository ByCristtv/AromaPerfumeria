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
