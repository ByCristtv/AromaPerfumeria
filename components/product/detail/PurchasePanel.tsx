"use client";

import ProductHeader from "./ProductHeader";
import PriceTag from "./PriceTag";
import StockBadge from "./StockBadge";
import VariantSelector from "./VariantSelector";
import QuantityStepper from "./QuantityStepper";
import AddToCartButton from "./AddToCartButton";
import type { ProductDetailData, ProductVariant } from "@/types/product";

interface PurchasePanelProps {
  product: ProductDetailData;
  selectedVariant: ProductVariant;
  variants: ProductVariant[];
  onSelectVariant: (v: ProductVariant) => void;
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  effectivePrice: number;
  hasOffer: boolean;
  outOfStock: boolean;
  /** Sellable units of the selected variant (decant-aware). */
  availableStock: number;
  onAddToCart: () => void;
}

export default function PurchasePanel({
  product,
  selectedVariant,
  variants,
  onSelectVariant,
  quantity,
  onIncrement,
  onDecrement,
  effectivePrice,
  hasOffer,
  outOfStock,
  availableStock,
  onAddToCart,
}: PurchasePanelProps) {
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
