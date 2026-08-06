"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { useWholesaleStatus } from "@/hooks/useWholesaleStatus";
import type { VariantPricing } from "@/lib/pricing/wholesale";

type PricingMap = Record<string, VariantPricing>;

export interface UseWholesalePricingMapResult {
  /** The viewer is an approved wholesale buyer. */
  eligible: boolean;
  /** Pricing keyed by variant id (empty until eligible + loaded). */
  pricingMap: PricingMap;
  /** True while the wholesale columns are still loading for an eligible buyer. */
  isLoading: boolean;
}

/**
 * Fetch the wholesale pricing columns for a fixed set of variants, ONCE, and
 * only when the viewer is an approved wholesale buyer. Mirrors
 * {@link useCartPricing} and {@link CatalogWholesaleProvider}: the wholesale
 * columns are business-confidential B2B pricing kept out of the public product
 * DTO (see getProductBySlug), so they're fetched client-side on demand and
 * never reach retail visitors. The server (place_order) stays authoritative —
 * this is display only.
 */
export function useWholesalePricingMap(
  variantIds: string[]
): UseWholesalePricingMapResult {
  const { isApproved: eligible } = useWholesaleStatus();

  // Stable, order-independent key so re-renders don't refetch needlessly.
  const sortedIds = useMemo(() => [...variantIds].sort(), [variantIds]);

  const query = useQuery<PricingMap>({
    queryKey: ["wholesale", "variant-pricing", sortedIds],
    enabled: eligible && sortedIds.length > 0,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_variants")
        .select(
          "id, price, offer_price, is_on_offer, is_wholesale_enabled, wholesale_price, min_wholesale_quantity"
        )
        .in("id", sortedIds);

      if (error) throw error;

      const map: PricingMap = {};
      for (const v of data ?? []) {
        map[v.id] = {
          price: v.price,
          offer_price: v.offer_price,
          is_on_offer: v.is_on_offer,
          is_wholesale_enabled: v.is_wholesale_enabled,
          wholesale_price: v.wholesale_price,
          min_wholesale_quantity: v.min_wholesale_quantity,
        };
      }
      return map;
    },
  });

  return {
    eligible,
    pricingMap: eligible ? query.data ?? {} : {},
    isLoading: eligible && sortedIds.length > 0 && query.isPending,
  };
}
