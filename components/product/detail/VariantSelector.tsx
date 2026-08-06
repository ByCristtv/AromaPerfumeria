"use client";

import { motion } from "framer-motion";
import type { ProductTypes, ProductVariant } from "@/types/product";
import { availableUnits } from "@/lib/stock";

interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedId: string;
  onSelect: (v: ProductVariant) => void;
  /** Parent decant ml pool — drives decant variants' availability. */
  decantPoolMl: number;
}

const TYPE_LABEL: Record<string, string> = {
  full_size: "Full size",
  decant: "Decant",
  set: "Set",
};

/**
 * Display order of the presentation groups. Bottles first, then decants, then
 * any sets — each rendered as its own labelled block, and only when it holds
 * at least one variant.
 */
const GROUP_ORDER: { type: ProductTypes; heading: string; hint: string }[] = [
  { type: "full_size", heading: "Frasco", hint: "Presentación completa" },
  { type: "decant", heading: "Decants", hint: "Fracciones del original" },
  { type: "set", heading: "Sets", hint: "Ediciones especiales" },
];

export default function VariantSelector({
  variants,
  selectedId,
  onSelect,
  decantPoolMl,
}: VariantSelectorProps) {
  if (variants.length === 0) return null;

  // Group by presentation type, keeping each group ordered by size ascending.
  const groups = GROUP_ORDER.map((g) => ({
    ...g,
    items: variants
      .filter((v) => v.product_type === g.type)
      .sort((a, b) => a.size_ml - b.size_ml),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="flex flex-col gap-7">
      {groups.map((group) => (
        <section key={group.type} aria-label={group.heading}>
          <div className="flex items-baseline justify-between mb-3">
            <div className="flex items-baseline gap-2.5">
              <h2 className="text-[11px] font-medium tracking-[0.28em] uppercase text-black/60">
                {group.heading}
              </h2>
              <span className="hidden sm:inline text-[11px] text-black/35">
                {group.hint}
              </span>
            </div>
            <span className="text-[11px] text-black/40">
              {group.items.length}{" "}
              {group.items.length === 1 ? "opción" : "opciones"}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {group.items.map((v) => (
              <VariantCard
                key={v.id}
                variant={v}
                selected={v.id === selectedId}
                disabled={availableUnits(v, decantPoolMl) <= 0}
                onClick={() => onSelect(v)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

interface VariantCardProps {
  variant: ProductVariant;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}

function VariantCard({ variant, selected, disabled, onClick }: VariantCardProps) {

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
