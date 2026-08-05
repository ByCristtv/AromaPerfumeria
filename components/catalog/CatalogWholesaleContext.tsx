"use client";

import { createContext, useContext, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { useWholesaleStatus } from "@/hooks/useWholesaleStatus";
import { type VariantPricing } from "@/lib/pricing/wholesale";

/**
 * Wholesale pricing for the visible catalog cards, fetched ONCE per grid and
 * shared via context so each {@link ProductCard} can show its dual price
 * without prop-drilling or per-card fetches.
 *
 * Mirrors {@link useCartPricing}: the wholesale price columns are fetched
 * client-side and ONLY when the viewer is an approved wholesale buyer. Retail
 * visitors never receive wholesale prices — they're kept out of the server
 * catalog DTO on purpose (business-confidential B2B pricing).
 */

type PricingMap = Record<string, VariantPricing>;

interface CatalogWholesaleValue {
  /** The viewer is an approved wholesale buyer. */
  eligible: boolean;
  /** Featured-variant pricing keyed by variant id (empty until eligible + loaded). */
  pricingMap: PricingMap;
}

const CatalogWholesaleContext = createContext<CatalogWholesaleValue>({
  eligible: false,
  pricingMap: {},
});

export function useCatalogWholesale(): CatalogWholesaleValue {
  return useContext(CatalogWholesaleContext);
}

export default function CatalogWholesaleProvider({
  variantIds,
  children,
}: {
  variantIds: string[];
  children: React.ReactNode;
}) {
  const { isApproved: eligible } = useWholesaleStatus();

  // Stable, order-independent key so pagination/re-renders don't refetch needlessly.
  const sortedIds = useMemo(() => [...variantIds].sort(), [variantIds]);

  const query = useQuery<PricingMap>({
    queryKey: ["wholesale", "catalog-pricing", sortedIds],
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

  const value = useMemo<CatalogWholesaleValue>(
    () => ({ eligible, pricingMap: eligible ? query.data ?? {} : {} }),
    [eligible, query.data]
  );

  return (
    <CatalogWholesaleContext.Provider value={value}>
      {children}
    </CatalogWholesaleContext.Provider>
  );
}
