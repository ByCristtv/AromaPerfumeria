import { createClient } from "@/lib/supabase/server";
import {
  STOCK_MOVEMENTS_PAGE_SIZE,
  type StockMovementRow,
  type StockMovementsPage,
} from "@/types/stockMovement";

/**
 * Fetch one page of stock movements for the admin panel.
 *
 * Runs on the SERVER (Server Component) with the request-bound Supabase client,
 * so the `admin_list_stock_movements` RPC sees the admin's JWT and its internal
 * `is_admin()` gate passes. All name resolution + pagination + the exact total
 * happen inside the single RPC call (no N+1, one round-trip per page).
 *
 * Never throws: any failure degrades to an empty first page so the panel renders.
 */
export async function getStockMovements(
  page: number,
  search?: string,
  pageSize: number = STOCK_MOVEMENTS_PAGE_SIZE
): Promise<StockMovementsPage> {
  const currentPage = Math.max(1, Math.floor(page) || 1);
  const offset = (currentPage - 1) * pageSize;
  const trimmed = search?.trim() || undefined;

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("admin_list_stock_movements", {
    p_search: trimmed,
    p_limit: pageSize,
    p_offset: offset,
  });

  if (error) {
    console.error("getStockMovements failed:", error.message);
    return { rows: [], total: 0, currentPage: 1, totalPages: 1, pageSize };
  }

  const raw = (data ?? []) as (StockMovementRow & { total_count: number })[];
  const total = raw.length > 0 ? Number(raw[0].total_count) : 0;
  const rows: StockMovementRow[] = raw.map((row) => {
    const next = { ...row } as Partial<typeof row>;
    delete next.total_count;
    return next as StockMovementRow;
  });

  return {
    rows,
    total,
    currentPage,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    pageSize,
  };
}
