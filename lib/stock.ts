import type { ProductTypes } from "@/types/product";

/**
 * Minimal shape needed to compute a variant's sellable units.
 */
export interface StockableVariant {
  product_type: ProductTypes | string;
  size_ml: number;
  /** Manual stock column — authoritative for everything EXCEPT decants. */
  stock: number;
}

/**
 * Sellable units for a variant — the single source of truth for "how many
 * can I buy" across catalog, detail, cart, checkout and quantity selectors.
 *
 * Decants do NOT persist stock on the variant (it stays 0). Their inventory
 * is the parent product's shared ml pool (`products.decant_stock_ml`), so the
 * available units are derived:
 *
 *   availableUnits = floor(decant_stock_ml / variant.size_ml)
 *
 * Every other variant type (full_size, set, …) keeps using its own `stock`
 * column exactly as before.
 *
 * @param variant       The variant (product_type, size_ml, stock).
 * @param decantPoolMl  Parent product's `decant_stock_ml`. Only consulted for
 *                      decants; pass null/undefined when unknown.
 */
export function availableUnits(
  variant: StockableVariant,
  decantPoolMl: number | null | undefined
): number {
  if (variant.product_type === "decant") {
    if (!decantPoolMl || decantPoolMl <= 0 || variant.size_ml <= 0) return 0;
    return Math.floor(decantPoolMl / variant.size_ml);
  }
  return variant.stock;
}

/** Convenience: is this variant purchasable right now? */
export function isInStock(
  variant: StockableVariant,
  decantPoolMl: number | null | undefined
): boolean {
  return availableUnits(variant, decantPoolMl) > 0;
}
