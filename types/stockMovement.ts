import type { Database } from "./database";

export type StockMovementReason =
  Database["public"]["Enums"]["stock_movement_reason"];
export type ProductTypeEnum = Database["public"]["Enums"]["product_type"];

/** Items per page in the admin stock-movements table. */
export const STOCK_MOVEMENTS_PAGE_SIZE = 10;

/**
 * One row of the admin "Movimientos de Stock" table. Flattened/name-resolved
 * shape returned by the `admin_list_stock_movements` RPC. Movements are
 * dual-mode: variant-level (delta on `stock`) or decant-pool-level (`ml_delta`).
 */
export interface StockMovementRow {
  id: string;
  created_at: string;
  reason: StockMovementReason;
  variant_id: string | null;
  product_id: string | null;
  previous_stock: number | null;
  new_stock: number | null;
  delta: number | null;
  previous_ml: number | null;
  new_ml: number | null;
  ml_delta: number | null;
  notes: string | null;
  sku: string | null;
  size_ml: number | null;
  product_type: ProductTypeEnum | null;
  product_name: string | null;
  brand_name: string | null;
  performed_by_name: string | null;
}

/** One page of stock movements with the pagination metadata the UI needs. */
export interface StockMovementsPage {
  rows: StockMovementRow[];
  total: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
}

/** A single row of the bulk-stock form / `register_bulk_stock` payload. */
export interface BulkStockItem {
  variant_id: string;
  quantity: number;
}
