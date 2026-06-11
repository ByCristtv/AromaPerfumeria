import { supabase } from "@/lib/supabase/client";
import type { DecantStockRow } from "@/types/product";

/**
 * Columns for the decant-stock table. Rooted at `product_variants` (filtered to
 * decants) because size_ml + sku live there; the pool itself (`decant_stock_ml`)
 * and the fragrance metadata are pulled up from the parent product.
 */
const DECANT_STOCK_SELECT = `
  id,
  sku,
  size_ml,
  is_active,
  products!product_variants_product_id_fkey!inner (
    id,
    name,
    decant_stock_ml,
    brands ( name )
  )
` as const;

/** Shape PostgREST returns for the embedded select above. */
type RawDecantVariant = {
  id: string;
  sku: string;
  size_ml: number | null;
  is_active: boolean | null;
  products: {
    id: string;
    name: string | null;
    decant_stock_ml: number | null;
    brands: { name: string | null } | null;
  } | null;
};

/**
 * Fetch every decant variant alongside its parent product's shared ml pool.
 * Sorted client-side (product name, then size) so the same product's sizes sit
 * together regardless of PostgREST embedded-order quirks.
 */
export const getDecantStock = async (): Promise<DecantStockRow[]> => {
  const { data, error } = await supabase
    .from("product_variants")
    .select(DECANT_STOCK_SELECT)
    .eq("product_type", "decant");

  if (error) {
    throw new Error(error.message);
  }

  const rows = ((data ?? []) as unknown as RawDecantVariant[]).map(
    (v): DecantStockRow => {
    const parent = v.products ?? null;
    const pool = Number(parent?.decant_stock_ml ?? 0);
    const size = Number(v.size_ml ?? 0);

    return {
      variant_id: v.id,
      product_id: parent?.id ?? "",
      sku: v.sku,
      size_ml: size,
      name: parent?.name ?? "Sin nombre",
      brand: parent?.brands?.name ?? "Sin marca",
      pool_ml: pool,
      // floor: a partial decant can't be sold.
      possible_units: size > 0 ? Math.floor(pool / size) : 0,
      is_active: !!v.is_active,
    };
  });

  return rows.sort(
    (a, b) => a.name.localeCompare(b.name) || a.size_ml - b.size_ml
  );
};

export const DECANT_STOCK_QUERY_KEY = ["admin", "decant_stock"] as const;
