import { supabase } from '@/lib/supabase'

export async function uploadProductImage(file: File) {
  const filePath = `product-images/${crypto.randomUUID()}-${file.name}`
  console.log("Subiendo imagen a Supabase Storage con ruta:", filePath)

  const { error } = await supabase.storage
    .from('product-images')
    .upload(filePath, file)

  if (error) {
    console.error("Error subiendo imagen:", error)
    throw new Error('Error uploading image')
  }

  const { data } = supabase.storage
    .from('product-images')
    .getPublicUrl(filePath)

  console.log("URL pública de la imagen:", data.publicUrl)
  return data.publicUrl
}