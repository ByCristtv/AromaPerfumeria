
import { ProductCardData, ProductTypes } from "./product";

/** Items fetched per catalog page (offset-based pagination). */
export const PRODUCTS_PAGE_SIZE = 20;

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
  items: ProductCardData[];
  nextPage: number | null;
  total: number;
}

/**
 * One page of catalog results with full pagination metadata. Returned by
 * the server-side `getCatalogPage` and consumed by the `/products` route
 * and its premium numbered pagination UI.
 */
export interface CatalogPageResult {
  products: ProductCardData[];
  totalProducts: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  pageSize: number;
}

