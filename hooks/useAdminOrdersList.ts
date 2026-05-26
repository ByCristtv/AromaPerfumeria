"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

export type AdminOrderRow = Pick<
  Database["public"]["Tables"]["orders"]["Row"],
  | "id"
  | "order_number"
  | "customer_name"
  | "customer_email"
  | "customer_phone"
  | "total"
  | "order_status"
  | "payment_status"
  | "source"
  | "created_at"
>;

export type OrderStatusFilter = "all" | "pending" | "received" | "shipped" | "denied";
export type PaymentStatusFilter = "all" | "pending" | "paid" | "failed" | "refunded";

export interface UseAdminOrdersListArgs {
  search?: string;
  orderStatus?: OrderStatusFilter;
  paymentStatus?: PaymentStatusFilter;
}

const PAGE_SIZE = 50;

async function fetchAdminOrders(
  args: UseAdminOrdersListArgs
): Promise<AdminOrderRow[]> {
  let query = supabase
    .from("orders")
    .select(
      "id, order_number, customer_name, customer_email, customer_phone, total, order_status, payment_status, source, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (args.orderStatus && args.orderStatus !== "all") {
    query = query.eq("order_status", args.orderStatus);
  }
  if (args.paymentStatus && args.paymentStatus !== "all") {
    query = query.eq("payment_status", args.paymentStatus);
  }

  const rawSearch = args.search?.trim();
  if (rawSearch) {
    // Sanitize: PostgREST .or() syntax uses ',' '(' ')' as filter separators.
    // We also strip '*' to prevent the user injecting their own wildcards.
    // Accented characters and most text are preserved.
    const safe = rawSearch.replace(/[,()*]/g, "");
    if (safe) {
      if (/^\d+$/.test(safe)) {
        // Numeric search — also try matching order_number exactly.
        query = query.or(
          `customer_name.ilike.*${safe}*,customer_email.ilike.*${safe}*,customer_phone.ilike.*${safe}*,order_number.eq.${safe}`
        );
      } else {
        query = query.or(
          `customer_name.ilike.*${safe}*,customer_email.ilike.*${safe}*,customer_phone.ilike.*${safe}*`
        );
      }
    }
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as AdminOrderRow[];
}

/**
 * TanStack Query for the admin orders list.
 *
 * RLS allows admins to read all orders (existing "Admins can view all orders"
 * policy). Non-admins are blocked by proxy.ts before reaching the page that
 * calls this hook, so we don't need an extra is_admin check here.
 *
 * staleTime is short (30s) because server actions revalidatePath after
 * mutations — that triggers a refetch on the next render anyway.
 *
 * For v1 we cap at 50 rows. If your order volume grows past that, we add
 * keyset pagination (or infinite scroll) here without changing the API.
 */
export function useAdminOrdersList(args: UseAdminOrdersListArgs) {
  return useQuery({
    queryKey: ["admin-orders", args],
    queryFn: () => fetchAdminOrders(args),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}
