
import { ProductTypes, VariantCardData } from "./product";

/** Items fetched per catalog page (offset-based pagination). */
export const PRODUCTS_PAGE_SIZE = 12;

export interface ProductFiltersProps {
  selectedCategory?: string;
  onCategoryChange: (category: string) => void;
}

export interface ProductTypeFilterProps {
  selectedType?: ProductTypes | "";
  onTypeChange: (type: ProductTypes | "") => void;
}

export type ProductOrderBy = "price_asc" | "price_desc" | "name_asc" | "name_desc";

/**
 * Catalog query filters. Lives here (not inside the data-fetching
 * module) so UI, hooks, and services share a single source of truth.
 * Empty string / undefined on any field means "no filter".
 */
export interface ProductFilters {
  /** Category UUID. */
  category?: string;
  /** Variant `product_type` (`full_size` | `decant` | `set`). */
  productType?: ProductTypes | "";
  orderBy?: ProductOrderBy;
  query?: string;
}

/**
 * One page of catalog results. `nextPage` is the param for the next
 * fetch, or `null` when the inventory has been fully traversed.
 */
export interface ProductPage {
  items: VariantCardData[];
  nextPage: number | null;
  total: number;
}

export interface ProductFilterOrderByProps {
  selectedOrder: ProductOrderBy;
  onOrderChange: (order: ProductOrderBy) => void;
}

export interface ProductListProps {
  products: VariantCardData[];
  isLoading: boolean;
}

