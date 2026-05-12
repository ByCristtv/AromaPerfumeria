import { useQuery } from "@tanstack/react-query";
import { getCategories } from "@/features/categories/getCategories";

export const CATEGORIES_QUERY_KEY = ["categories"] as const;

export function useCategories() {
  return useQuery({
    queryKey: CATEGORIES_QUERY_KEY,
    queryFn: getCategories,
  });
}
