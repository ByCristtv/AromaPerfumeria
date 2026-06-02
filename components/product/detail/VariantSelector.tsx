"use client";

import { motion } from "framer-motion";
import type { ProductVariant } from "@/types/product";

interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedId: string;
  onSelect: (v: ProductVariant) => void;
}

const TYPE_LABEL: Record<string, string> = {
  full_size: "Full size",
  decant: "Decant",
};

export default function VariantSelector({
  variants,
  selectedId,
  onSelect,
}: VariantSelectorProps) {
  if (variants.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[11px] font-medium tracking-[0.28em] uppercase text-black/60">
          Presentación
        </h2>
        <span className="text-[11px] text-black/40">
          {variants.length} {variants.length === 1 ? "opción" : "opciones"}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {variants.map((v) => (
          <VariantCard
            key={v.id}
            variant={v}
            selected={v.id === selectedId}
            onClick={() => onSelect(v)}
          />
        ))}
      </div>
    </div>
  );
}

interface VariantCardProps {
  variant: ProductVariant;
  selected: boolean;
  onClick: () => void;
}

function VariantCard({ variant, selected, onClick }: VariantCardProps) {
  const disabled = variant.stock <= 0;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? undefined : { y: -2 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 350, damping: 28 }}
      aria-pressed={selected}
      className="relative text-left px-4 py-3 rounded-xl bg-white disabled:cursor-not-allowed disabled:opacity-50"
      style={{
        border: selected
          ? "1px solid #c9a96e"
          : "1px solid rgba(0,0,0,0.10)",
        boxShadow: selected
          ? "0 0 0 3px rgba(201,169,110,0.12), 0 14px 28px -16px rgba(201,169,110,0.5)"
          : "0 1px 2px rgba(0,0,0,0.03)",
        transition:
          "border-color 300ms, box-shadow 300ms, background-color 300ms",
      }}
    >
      {/* Selected ribbon */}
      {selected && (
        <motion.span
          layoutId="variant-active"
          aria-hidden
          className="absolute inset-0 rounded-xl pointer-events-none"
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
          style={{
            background:
              "linear-gradient(180deg, rgba(201,169,110,0.10), rgba(201,169,110,0.02))",
          }}
        />
      )}

      <span className="relative flex flex-col gap-0.5">
        <span
          className="text-base font-semibold tracking-tight"
          style={{ color: selected ? "#8a7341" : "#0a0a0a" }}
        >
          {variant.size_ml} ml
        </span>
        <span className="text-[10.5px] tracking-[0.18em] uppercase text-black/45">
          {TYPE_LABEL[variant.product_type] || variant.product_type}
        </span>
        {disabled && (
          <span className="mt-1 text-[10.5px] tracking-[0.18em] uppercase text-red-500/70">
            Agotado
          </span>
        )}
      </span>
    </motion.button>
  );
}
