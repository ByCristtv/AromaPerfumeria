"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";

/**
 * Shape returned by the calculate_shipping_cost RPC. Matches the jsonb_build_object
 * keys in supabase/migrations/20260525000200_place_order_rewrite.sql.
 */
export interface ShippingPreview {
  cost: number;
  zone_code: string;
  zone_name: string;
  free_shipping_applied: boolean;
  free_shipping_threshold: number | null;
}

interface UseShippingPreviewArgs {
  /** Selected CR canton code, e.g. "101". Undefined/empty disables the query. */
  canton_code: string | undefined;
  /** Current cart subtotal in CRC. */
  subtotal: number;
  /** Allows the parent to suppress the query (e.g. cart is empty). */
  enabled?: boolean;
}

async function fetchShippingPreview(
  canton_code: string,
  subtotal: number
): Promise<ShippingPreview> {
  const { data, error } = await supabase.rpc("calculate_shipping_cost", {
    p_canton_code: canton_code,
    p_subtotal: subtotal,
  });

  if (error) throw error;
  if (!data) throw new Error("calculate_shipping_cost returned no data");

  return data as unknown as ShippingPreview;
}

/**
 * Live shipping cost preview for the checkout page.
 *
 * Inputs don't change rapidly in practice (canton is a <select>, subtotal is
 * fixed once you reach /checkout), so no debouncing — TanStack Query's
 * staleTime + cache is enough.
 *
 * The query is disabled until canton_code is set, so the network tab stays
 * clean before the user picks a canton.
 */
export function useShippingPreview({
  canton_code,
  subtotal,
  enabled = true,
}: UseShippingPreviewArgs) {
  return useQuery({
    queryKey: ["shipping-preview", canton_code, subtotal],
    queryFn: () => fetchShippingPreview(canton_code as string, subtotal),
    enabled: enabled && !!canton_code && subtotal >= 0,
    staleTime: 60_000,
    // Keep showing the previous result briefly while a new fetch is in flight
    // (e.g., when canton changes) so the totals row doesn't flash to blank.
    placeholderData: (prev) => prev,
  });
}
