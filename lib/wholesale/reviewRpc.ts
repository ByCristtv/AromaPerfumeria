import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Typed wrapper for the `review_wholesale_application` RPC (migration
 * 20260804000100). Centralizes the arg names and the Json→result narrowing so
 * callers get a clean `{ data, error }` with a real result shape — the same
 * pattern lib/checkout/orderService.ts uses for place_order.
 */

export type WholesaleDecision = "approved" | "rejected";

export interface ReviewWholesaleResult {
  user_id: string;
  application_status: WholesaleDecision;
  previous_status: string | null;
}

export async function reviewWholesaleApplication(
  supabase: SupabaseClient<Database>,
  userId: string,
  decision: WholesaleDecision
): Promise<{ data: ReviewWholesaleResult | null; error: PostgrestError | null }> {
  const { data, error } = await supabase.rpc("review_wholesale_application", {
    p_user_id: userId,
    p_decision: decision,
  });

  return {
    data: (data as unknown as ReviewWholesaleResult | null) ?? null,
    error,
  };
}
