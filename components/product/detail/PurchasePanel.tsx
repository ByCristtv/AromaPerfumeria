"use client";

import ProductHeader from "./ProductHeader";
import PriceTag from "./PriceTag";
import StockBadge from "./StockBadge";
import VariantSelector from "./VariantSelector";
import QuantityStepper from "./QuantityStepper";
import AddToCartButton from "./AddToCartButton";
import WholesalePanel from "./WholesalePanel";
import type { ProductDetailData, ProductVariant } from "@/types/product";
import {
  isWholesaleConfigured,
  resolveLinePricing,
  type VariantPricing,
} from "@/lib/pricing/wholesale";

interface PurchasePanelProps {
  product: ProductDetailData;
  selectedVariant: ProductVariant;
  variants: ProductVariant[];
  onSelectVariant: (v: ProductVariant) => void;
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  /** Set the quantity directly — powers the wholesale "reach minimum" shortcut. */
  onSetQuantity: (q: number) => void;
  effectivePrice: number;
  hasOffer: boolean;
  outOfStock: boolean;
  /** Sellable units of the selected variant (decant-aware). */
  availableStock: number;
  onAddToCart: () => void;
  /** Viewer is an approved wholesale buyer. */
  wholesaleEligible: boolean;
  /** Wholesale pricing columns for the selected variant (eligible buyers only). */
  wholesalePricing?: VariantPricing;
}

export default function PurchasePanel({
  product,
  selectedVariant,
  variants,
  onSelectVariant,
  quantity,
  onIncrement,
  onDecrement,
  onSetQuantity,
  effectivePrice,
  hasOffer,
  outOfStock,
  availableStock,
  onAddToCart,
  wholesaleEligible,
  wholesalePricing,
}: PurchasePanelProps) {
  // Wholesale only surfaces for approved buyers on a fully-configured variant.
  const showWholesale =
    wholesaleEligible &&
    !!wholesalePricing &&
    isWholesaleConfigured(wholesalePricing);

  const line = showWholesale
    ? resolveLinePricing(wholesalePricing, quantity, true)
    : null;

  const minQty = line?.minWholesaleQuantity ?? 0;
  // "Reach minimum" shortcut: only shown when the minimum is actually
  // stockable AND the buyer hasn't reached it yet. Once quantity >= minimum the
  // shortcut has served its purpose and disappears — the stepper takes over for
  // fine adjustments, and there's no way to accidentally overshoot in one tap.
  const showReachMinimum =
    showWholesale && minQty > 0 && availableStock >= minQty && quantity < minQty;

  return (
    <div className="flex flex-col gap-7">
      <ProductHeader
        brand={product.brands?.name || ""}
        name={product.name}
        gender={product.gender}
        concentration={product.concentration}
      />

      <div className="flex items-end justify-between gap-4 flex-wrap">
        <PriceTag
          price={effectivePrice}
          originalPrice={hasOffer ? selectedVariant.price : undefined}
          onOffer={hasOffer}
        />
        <StockBadge stock={availableStock} />
      </div>

      {showWholesale && line && (
        <WholesalePanel
          wholesalePrice={line.wholesalePrice as number}
          minQuantity={minQty}
          active={line.wasWholesale}
          unitsToUnlock={line.unitsToUnlock ?? 0}
        />
      )}

      <span
        aria-hidden
        className="h-px w-full"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(201,169,110,0.4), transparent)",
        }}
      />

      <VariantSelector
        variants={variants}
        selectedId={selectedVariant.id}
        onSelect={onSelectVariant}
        decantPoolMl={product.decant_stock_ml}
      />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-[11px] font-medium tracking-[0.28em] uppercase text-black/60">
            Cantidad
          </h2>
          <QuantityStepper
            quantity={quantity}
            max={Math.max(1, availableStock)}
            onIncrement={onIncrement}
            onDecrement={onDecrement}
          />
        </div>

        {showReachMinimum && (
          <button
            type="button"
            onClick={() => onSetQuantity(minQty)}
            aria-label={`Fijar la cantidad en el mínimo mayorista de ${minQty} unidades`}
            className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[11px] font-semibold tracking-[0.18em] uppercase transition-colors hover:bg-[rgba(201,169,110,0.14)]"
            style={{
              color: "#7a5e2e",
              border: "1px solid rgba(201,169,110,0.5)",
              background:
                "linear-gradient(180deg, rgba(201,169,110,0.08), transparent)",
            }}
          >
            Alcanzar mínimo mayorista · {minQty} uds.
          </button>
        )}
      </div>

      <AddToCartButton onAdd={onAddToCart} disabled={outOfStock} />

      <ul className="grid grid-cols-3 gap-3 pt-2">
        <Perk title="Original" subtitle="100% auténtico" />
        <Perk title="Envío rápido" subtitle="Todo el país" />
        <Perk title="Soporte" subtitle="WhatsApp" />
      </ul>
    </div>
  );
}

function Perk({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <li
      className="text-center px-2 py-3 rounded-xl"
      style={{
        border: "1px solid rgba(0,0,0,0.06)",
        background:
          "linear-gradient(180deg, rgba(201,169,110,0.05), transparent)",
      }}
    >
      <p
        className="text-[11px] font-medium tracking-[0.18em] uppercase"
        style={{ color: "#8a7341" }}
      >
        {title}
      </p>
      <p className="text-[11px] text-black/55 mt-1">{subtitle}</p>
    </li>
  );
}
