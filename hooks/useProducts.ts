import { useQuery } from "@tanstack/react-query";
import { ProductCardData } from "@/types/product"; // Ajusta la ruta de tus tipos
import { getProducts, ProductFilters } from "@/features/products/getProducts";

export const PRODUCTS_QUERY_KEY = (filters?: ProductFilters) => filters ? ["products", filters] : ["products"];

export function useProducts( filters?: ProductFilters ) {
  return useQuery<ProductCardData[]>({
    queryKey: PRODUCTS_QUERY_KEY(filters),
    queryFn: () => getProducts(20, filters),
  });
}