import { useQuery } from "@tanstack/react-query";
import {
  getBrandsAdmin,
  ADMIN_BRANDS_QUERY_KEY,
} from "@/features/brands/brandsAdmin";

/** Full brand list for the admin management table. */
export function useAdminBrands() {
  return useQuery({
    queryKey: ADMIN_BRANDS_QUERY_KEY,
    queryFn: getBrandsAdmin,
  });
}
