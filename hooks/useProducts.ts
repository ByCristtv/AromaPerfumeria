import { useInfiniteQuery } from "@tanstack/react-query";
import {
  PRODUCTS_PAGE_SIZE,
  type ProductFilters,
} from "@/types/productFilter";
import { getProductsPage } from "@/features/products/getProducts";

/**
 * Catalog query key. The bare `["products"]` prefix is what the admin
 * mutation forms invalidate, so every filtered/paginated variant must
 * stay under it for those invalidations to cascade.
 */
export const PRODUCTS_QUERY_KEY = (filters?: ProductFilters) =>
  filters ? (["products", filters] as const) : (["products"] as const);

/**
 * Infinite, offset-paginated catalog feed. React Query refetches from
 * page 0 automatically whenever `filters` (and thus the key) changes.
 */
export function useProducts(filters?: ProductFilters) {
  return useInfiniteQuery({
    queryKey: PRODUCTS_QUERY_KEY(filters),
    queryFn: ({ pageParam }) =>
      getProductsPage(pageParam, PRODUCTS_PAGE_SIZE, filters),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
  });
}
