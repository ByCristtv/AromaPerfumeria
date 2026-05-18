/**
 * Props consumed by `<ProductFilters>` and `<ProductFilterOrderBy>`.
 * Kept in a separate module so multiple components can share them
 * without circular imports against `types/product.ts`.
 */

export interface ProductFiltersProps {
  selectedCategory?: string;
  onCategoryChange: (category: string) => void;
}

export type ProductOrderBy = "price_asc" | "price_desc" | "name_asc" | "name_desc";

export interface ProductFilterOrderByProps {
  selectedOrder: ProductOrderBy;
  onOrderChange: (order: ProductOrderBy) => void;
}
