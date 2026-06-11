import { supabase } from "@/lib/supabase/client";
import type { TransformToDecantDTO } from "@/types/product";

/**
 * Turn full-size bottles into decant pool liquid.
 *
 * Delegates to the `transform_to_decant` Postgres RPC, which atomically:
 *   1. writes the immutable `decant_transformations` ledger row,
 *   2. decrements the source full-size variant's stock (audited),
 *   3. adds `size_ml * quantity` ml to the parent product's pool (audited).
 *
 * The RPC is admin-gated and validates that the source is a `full_size`
 * variant, so the UI guard here is purely for UX. Returns the RPC's JSON
 * summary (`new_pool_ml`, `ml_generated`, …).
 */
export async function transformToDecant(payload: TransformToDecantDTO) {
  const { data, error } = await supabase.rpc("transform_to_decant", {
    p_source_variant_id: payload.source_variant_id,
    p_quantity: payload.quantity,
    p_notes: payload.notes?.trim() ? payload.notes.trim() : undefined,
  });

  if (error) throw error;
  return data;
}
