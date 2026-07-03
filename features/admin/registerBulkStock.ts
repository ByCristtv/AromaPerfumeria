import { supabase } from "@/lib/supabase/client";
import type { BulkStockItem } from "@/types/stockMovement";

export interface RegisterBulkStockResult {
  processed: number;
  total_added: number;
}

/**
 * Register an incoming-stock batch for many variants at once.
 *
 * Delegates to the `register_bulk_stock` RPC, which applies the whole batch in
 * ONE transaction: per item it locks the variant, snapshots previous→new stock,
 * updates it, and writes a semantic 'restock' movement. Decants are rejected
 * server-side. If any item fails the entire batch rolls back, so stock and the
 * audit ledger never drift apart.
 *
 * The RPC is admin-gated; the client-side checks are purely for UX.
 */
export async function registerBulkStock(
  items: BulkStockItem[],
  notes?: string
): Promise<RegisterBulkStockResult> {
  const { data, error } = await supabase.rpc("register_bulk_stock", {
    p_payload: {
      items: items.map((it) => ({
        variant_id: it.variant_id,
        quantity: it.quantity,
      })),
      notes: notes?.trim() || null,
    },
  });

  if (error) throw error;
  return data as unknown as RegisterBulkStockResult;
}
