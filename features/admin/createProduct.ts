import { uploadProductImage } from '@/services/uploadProductImage'
import { CreateProductDTO, CreateVariantDTO } from '@/types/product'
import { supabase } from '@/lib/supabase' // El cliente tipado
import { ProductTypes } from '@/types/database'

export async function createProduct(formData: CreateProductDTO) {
  const imageUrl = await uploadProductImage(formData.file)
  console.log("URL de la imagen subida")
  // Ahora TS validará que p_name, p_brand_id, etc., existan en los Args de 'create_new_product'
  const { data, error } = await supabase.rpc('create_new_product', {
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
    p_offer_price: formData.is_on_offer? Number(formData.offer_price) : null
  })
  console.log("Respuesta del RPC:", { data, error })

  if (error) throw error
  return data
}

/**
 * 2. CREAR VARIANT ADICIONAL
 */
export async function createVariant(variantData: CreateVariantDTO) {
  // TS revisará que todos los campos coincidan con 'Insert' de product_variants
  const { data, error } = await supabase
    .from('product_variants')
    .insert({
      product_id: variantData.product_id,
      sku: variantData.sku,
      price: variantData.price,
      stock: variantData.stock,
      size_ml: variantData.size_ml,
      product_type: variantData.product_type as ProductTypes, // Cast si el enum da problemas
      is_on_offer: variantData.is_on_offer,
      offer_price: variantData.offer_price,
      is_active: true
    })
    .select()
    .single()

  if (error) throw error
  return data
}