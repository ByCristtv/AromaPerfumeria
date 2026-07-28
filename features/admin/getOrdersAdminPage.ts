import { createClient } from "@/lib/supabase/server";
import { ADMIN_PAGE_SIZE, paginate, type Paginated } from "@/lib/pagination";
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

export interface OrdersQuery {
  search?: string;
  orderStatus?: OrderStatusFilter;
  paymentStatus?: PaymentStatusFilter;
}

const ORDER_COLUMNS =
  "id, order_number, customer_name, customer_email, customer_phone, total, order_status, payment_status, source, created_at";

/**
 * Fetch one page of orders for the admin list.
 *
 * Runs on the SERVER with the request-bound Supabase client, so the "Admins can
 * view all orders" RLS policy applies (non-admins are redirected by proxy.ts
 * before this runs). Search + filters are all on `orders` columns, so plain
 * PostgREST with `.range()` + `{ count: "exact" }` gives server-side pagination
 * and the exact total in one round-trip — no RPC needed.
 *
 * Never throws: any failure degrades to an empty first page so the panel renders.
 */
export async function getOrdersAdminPage(
  page: number,
  filters: OrdersQuery = {},
  pageSize: number = ADMIN_PAGE_SIZE
): Promise<Paginated<AdminOrderRow>> {
  const supabase = await createClient();
  const offset = (Math.max(1, Math.floor(page) || 1) - 1) * pageSize;

  // Filter methods (.eq/.or) must be applied while this is a FilterBuilder, before
  // .order()/.range() turn it into a TransformBuilder.
  let query = supabase.from("orders").select(ORDER_COLUMNS, { count: "exact" });

  if (filters.orderStatus && filters.orderStatus !== "all") {
    query = query.eq("order_status", filters.orderStatus);
  }
  if (filters.paymentStatus && filters.paymentStatus !== "all") {
    query = query.eq("payment_status", filters.paymentStatus);
  }

  const rawSearch = filters.search?.trim();
  if (rawSearch) {
    // Sanitize: PostgREST .or() uses ',' '(' ')' as filter separators, and '*' is
    // its wildcard — strip all so the user can't inject filter syntax. Accents and
    // ordinary text are preserved.
    const safe = rawSearch.replace(/[,()*]/g, "");
    if (safe) {
      if (/^\d+$/.test(safe)) {
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

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) {
    console.error("getOrdersAdminPage failed:", error.message);
    return { rows: [], total: 0, currentPage: 1, totalPages: 1, pageSize };
  }

  const total = count ?? 0;
  const { currentPage, totalPages } = paginate(total, page, pageSize);

  return {
    rows: (data ?? []) as AdminOrderRow[],
    total,
    currentPage,
    totalPages,
    pageSize,
  };
}
