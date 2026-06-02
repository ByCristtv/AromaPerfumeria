"use client";

import { useMemo, useState, useCallback } from "react";
import type { ProductDetailData, ProductVariant } from "@/types/product";

export interface UseProductSelectionReturn {
  sortedVariants: ProductVariant[];
  selectedVariant: ProductVariant;
  selectVariant: (v: ProductVariant) => void;
  quantity: number;
  setQuantity: (q: number) => void;
  increment: () => void;
  decrement: () => void;
  effectivePrice: number;
  hasOffer: boolean;
  outOfStock: boolean;
}

/**
 * Encapsulates variant + quantity state for the product detail page.
 * Keeps the rendering layer dumb — components only read derived values.
 */
export function useProductSelection(
  product: ProductDetailData
): UseProductSelectionReturn {
  const sortedVariants = useMemo(
    () =>
      [...product.product_variants].sort((a, b) => a.position - b.position),
    [product.product_variants]
  );

  const initial =
    sortedVariants.find((v) => v.id === product.featured_variant_id) ??
    sortedVariants[0];

  const [selectedVariant, setSelectedVariant] =
    useState<ProductVariant>(initial);
  const [quantity, setQuantityState] = useState(1);

  const selectVariant = useCallback((v: ProductVariant) => {
    setSelectedVariant(v);
    // Reset quantity so the user never holds a number that exceeds the new
    // variant's stock.
    setQuantityState(1);
  }, []);

  const setQuantity = useCallback(
    (q: number) => {
      const clamped = Math.max(1, Math.min(q, selectedVariant.stock || 1));
      setQuantityState(clamped);
    },
    [selectedVariant.stock]
  );

  const increment = useCallback(
    () => setQuantity(quantity + 1),
    [quantity, setQuantity]
  );
  const decrement = useCallback(
    () => setQuantity(quantity - 1),
    [quantity, setQuantity]
  );

  const hasOffer =
    selectedVariant.is_on_offer && selectedVariant.offer_price != null;
  const effectivePrice = hasOffer
    ? (selectedVariant.offer_price as number)
    : selectedVariant.price;
  const outOfStock = selectedVariant.stock <= 0;

  return {
    sortedVariants,
    selectedVariant,
    selectVariant,
    quantity,
    setQuantity,
    increment,
    decrement,
    effectivePrice,
    hasOffer,
    outOfStock,
  };
}
