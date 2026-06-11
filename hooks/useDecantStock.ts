import { useQuery } from "@tanstack/react-query";
import {
  getDecantStock,
  DECANT_STOCK_QUERY_KEY,
} from "@/features/admin/getDecantStock";

export function useDecantStock() {
  return useQuery({
    queryKey: DECANT_STOCK_QUERY_KEY,
    queryFn: getDecantStock,
  });
}
