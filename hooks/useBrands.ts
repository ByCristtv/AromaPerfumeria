import { useQuery } from "@tanstack/react-query";
import { getBrands } from "@/features/brands/getBrands";

export const BRANDS_QUERY_KEY = ["brands"] as const;

export function useBrands() {
  return useQuery({
    queryKey: BRANDS_QUERY_KEY,
    queryFn: getBrands,
  });
}
