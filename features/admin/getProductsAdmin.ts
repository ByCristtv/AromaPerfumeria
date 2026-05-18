import { supabase } from "@/lib/supabase/client";
import { AdminProduct } from "@/types/product";

// 1. Definimos la interfaz exacta que necesita el Admin


// 2. El fetcher que hace la consulta enriquecida a Supabase
export const getProductsAdmin = async (): Promise<AdminProduct[]> => {
  // Ajusta los nombres de las tablas relacionales según tu DB. 
  // Asumo una tabla intermedia 'product_categories' que conecta con 'categories'.
  const { data, error } = await supabase
    .from("products")
    .select(`
      id,
      name,
      description,
      price,
      stock,
      brands ( name ),
      product_categories (
        categories (
          id,
          name
        )
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  // 3. Mapeamos la respuesta de Supabase a nuestra estructura limpia e intuitiva
  return (data || []).map((p: any) => {
    // Extraemos las categorías del anidamiento relacional
    const flatCategories = p.product_categories
      ? p.product_categories
          .map((pc: any) => pc.categories)
          .filter(Boolean)
      : [];

    return {
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price ?? 0,
      stock: p.stock ?? 0,
      brand: p.brands?.name || "Sin marca",
      categories: flatCategories,
    };
  });
};

// Key única para la caché de TanStack Query del Admin
export const ADMIN_PRODUCTS_QUERY_KEY = ["admin", "products"];