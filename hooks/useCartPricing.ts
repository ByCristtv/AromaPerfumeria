"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { useWholesaleStatus } from "@/hooks/useWholesaleStatus";
import {
  priceCart,
  type CartLineInput,
  type CartPricing,
  type VariantPricing,
} from "@/lib/pricing/wholesale";
import type { CartLineItem } from "@/types/product";

type VariantPricingMap = Record<string, VariantPricing>;

export interface UseCartPricingResult {
  pricing: CartPricing;
  /** True while wholesale variant data is still loading for an eligible buyer. */
  isLoading: boolean;
}

/**
 * Price a cart with wholesale rules applied.
 *
 * Keeps pricing in ONE place rather than smearing wholesale columns across every
 * product DTO and the persisted store:
 *   - Not eligible → price straight from each line's retail `price` (no fetch).
 *   - Eligible → fetch the wholesale columns for exactly the cart's variants and
 *     run them through the shared engine (lib/pricing/wholesale.ts). Recomputes
 *     naturally as quantities change.
 *
 * The server (place_order) independently recomputes and is authoritative — this
 * is display only.
 */
export function useCartPricing(cart: CartLineItem[]): UseCartPricingResult {
  const { isApproved: eligible } = useWholesaleStatus();

  // Stable, order-independent key so re-orders/quantity edits don't refetch.
  const variantIds = useMemo(
    () => cart.map((i) => i.variant_id).sort(),
    [cart]
  );

  const variantQuery = useQuery<VariantPricingMap>({
    queryKey: ["wholesale", "variant-pricing", variantIds],
    enabled: eligible && variantIds.length > 0,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_variants")
        .select(
          "id, price, offer_price, is_on_offer, is_wholesale_enabled, wholesale_price, min_wholesale_quantity"
        )
        .in("id", variantIds);

      if (error) throw error;

      const map: VariantPricingMap = {};
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

  const variantMap = variantQuery.data;

  const pricing = useMemo<CartPricing>(() => {
    const lines: CartLineInput[] = cart.map((item) => ({
      variant_id: item.variant_id,
      quantity: item.quantity,
      // Until the fetch resolves, fall back to retail so the total is never wrong-high.
      pricing: eligible ? variantMap?.[item.variant_id] ?? null : null,
      retailPrice: item.price,
    }));
    return priceCart(lines, eligible);
  }, [cart, eligible, variantMap]);

  return {
    pricing,
    isLoading: eligible && variantIds.length > 0 && variantQuery.isPending,
  };
}
