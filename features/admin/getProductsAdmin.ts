import { supabase } from "@/lib/supabase/client";
import type { AdminVariantRow, ProductTypes } from "@/types/product";

const ADMIN_VARIANT_SELECT = `
  id,
  sku,
  price,
  stock,
  size_ml,
  product_type,
  is_on_offer,
  offer_price,
  is_active,
  created_at,
  products!product_variants_product_id_fkey!inner (
    id,
    name,
    description,
    brands ( name ),
    product_categories (
      categories ( id, name )
    )
  )
` as const;

/**
 * Fetch all commercial variants for the admin table.
 *
 * Query is rooted at `product_variants` because price, stock, sku,
 * size, and product_type all live there — `products` only carries the
 * fragrance-level metadata (name, brand, categories). Parent fields
 * are flattened in the mapper so the UI consumes a single flat row.
 */
export const getProductsAdmin = async (): Promise<AdminVariantRow[]> => {
  const { data, error } = await supabase
    .from("product_variants")
    .select(ADMIN_VARIANT_SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }
  console.log("Raw admin products data:", data);

  return (data ?? []).map((v: any): AdminVariantRow => {
    const parent = v.products ?? null;
    const flatCategories = parent?.product_categories
      ? parent.product_categories
          .map((pc: any) => pc.categories)
          .filter(Boolean)
      : [];

    return {
      variant_id: v.id,
      product_id: parent?.id ?? "",
      sku: v.sku,
      size_ml: v.size_ml,
      product_type: v.product_type as ProductTypes,
      price: v.price ?? 0,
      stock: v.stock ?? 0,
      is_on_offer: !!v.is_on_offer,
      offer_price: v.offer_price ?? null,
      is_active: !!v.is_active,
      name: parent?.name ?? "Sin nombre",
      description: parent?.description ?? null,
      brand: parent?.brands?.name ?? "Sin marca",
      categories: flatCategories,
    };
  });
};

export const ADMIN_PRODUCTS_QUERY_KEY = ["admin", "product_variants"] as const;
