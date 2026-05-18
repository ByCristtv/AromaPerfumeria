import { useQuery } from "@tanstack/react-query";
import { getProductsAdmin, ADMIN_PRODUCTS_QUERY_KEY } from "@/features/admin/getProductsAdmin";

export function useAdminProducts() {
  return useQuery({
    queryKey: ADMIN_PRODUCTS_QUERY_KEY,
    queryFn: getProductsAdmin,
  });
}