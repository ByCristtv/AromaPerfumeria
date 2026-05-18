import { useQuery } from "@tanstack/react-query";
import { ProductCardData } from "@/types/product"; // Ajusta la ruta de tus tipos
import { getProducts } from "@/features/products/getProducts";

export const PRODUCTS_QUERY_KEY = ["products"];

export function useProducts() {
  return useQuery<ProductCardData[]>({
    queryKey: PRODUCTS_QUERY_KEY,
    queryFn: () => getProducts(20),
  });
}