"use client";

import { useMemo, useState } from "react";
import { useLowStock, type LowStockRow } from "@/hooks/useAnalytics";
import { useDecantStock } from "@/hooks/useDecantStock";
import type { DecantStockRow } from "@/types/product";

interface Props {
  threshold?: number;
}

/** The two surfaces the Low Stock section can display. */
type StockView = "products" | "decants";

/**
 * Decant sizes (ml) we report fillable units for. Ordered large → small so the
 * table reads "biggest decant first". Kept as a const so the header and body
 * stay in lockstep if the catalog ever adds a size.
 */
const DECANT_SIZES_ML = [10, 5, 2] as const;

/** Human labels for the variant types shown in the Productos view. */
const PRODUCT_TYPE_LABELS: Record<string, string> = {
  set: "Set",
  full_size: "Full size",
  decant: "Decant",
};

/**
 * Low-stock alerts, split into two conceptually different inventories:
 *
 *  • "Productos" — full-size bottles and sets, whose availability is a plain
 *    unit count (`product_variants.stock`). Decants are filtered OUT here: they
 *    never carry unit stock (it stays 0), so they'd otherwise flood the list as
 *    permanently "out of stock".
 *
 *  • "Decants" — the shared ml pool per product. There are no units to count;
 *    availability is liquid volume, so we show the remaining ml and how many
 *    10 / 5 / 2 ml decants that volume can still fill.
 *
 * threshold defaults to 5 (matches the analytics_low_stock RPC default) and
 * only affects the Productos view.
 */
export default function LowStockTable({ threshold = 5 }: Props) {
  const [view, setView] = useState<StockView>("products");

  return (
    <section className="rounded-2xl border border-[#c9a96e]/20 bg-[#1a1a1a] overflow-hidden">
      <header className="px-5 py-4 border-b border-[#c9a96e]/10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-[#ececec]">Bajo stock</h2>
          <p className="text-xs text-[#a5a5a5] mt-0.5">
            {view === "products"
              ? `Full size y sets con ≤ ${threshold} unidades disponibles`
              : "Mililitros restantes del pool de cada decant"}
          </p>
        </div>
        <ViewToggle value={view} onChange={setView} />
      </header>

      {view === "products" ? (
        <ProductsView threshold={threshold} />
      ) : (
        <DecantsView />
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// View toggle
// ─────────────────────────────────────────────────────────────────────────────

function ViewToggle({
  value,
  onChange,
}: {
  value: StockView;
  onChange: (v: StockView) => void;
}) {
  const options: { key: StockView; label: string }[] = [
    { key: "products", label: "Productos" },
    { key: "decants", label: "Decants" },
  ];

  return (
    <div
      role="tablist"
      aria-label="Tipo de inventario"
      className="inline-flex self-start rounded-lg border border-[#c9a96e]/20 bg-[#141414] p-0.5"
    >
      {options.map((opt) => {
        const active = value === opt.key;
        return (
          <button
            key={opt.key}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(opt.key)}
            className={
              "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors " +
              (active
                ? "bg-[#c9a96e] text-black"
                : "text-[#a5a5a5] hover:text-[#c9a96e]")
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Productos view — unit stock for full_size + set (decants excluded)
// ─────────────────────────────────────────────────────────────────────────────

function ProductsView({ threshold }: { threshold: number }) {
  const { data, isLoading, isError, error } = useLowStock({ threshold });

  // Decants report stock 0 by design (their inventory is the ml pool), so they
  // must never appear in the unit-stock list.
  const rows = useMemo(
    () => (data ?? []).filter((r) => r.product_type !== "decant"),
    [data]
  );

  if (isLoading) return <SkeletonRows />;
  if (isError)
    return <ErrorRow message={error instanceof Error ? error.message : "Error"} />;
  if (rows.length === 0)
    return (
      <p className="px-5 py-10 text-center text-sm text-emerald-300">
        Sin alertas. Todo tu inventario de full size y sets está sobre el umbral.
      </p>
    );

  return <ProductsTable rows={rows} />;
}

function ProductsTable({ rows }: { rows: LowStockRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-[#a5a5a5]">
            <th className="px-5 py-2">Producto</th>
            <th className="px-5 py-2">SKU</th>
            <th className="px-5 py-2 text-right">Stock</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#c9a96e]/10">
          {rows.map((row) => {
            const isOut = row.stock === 0;
            return (
              <tr key={row.variant_id} className="text-[#ececec]">
                <td className="px-5 py-3">
                  <div className="font-medium">{row.product_name}</div>
                  <div className="text-xs text-[#a5a5a5]">
                    {PRODUCT_TYPE_LABELS[row.product_type] ?? "Desconocido"} ·{" "}
                    {row.size_ml} ml
                  </div>
                </td>
                <td className="px-5 py-3 font-mono text-xs text-[#a5a5a5]">
                  {row.sku}
                </td>
                <td className="px-5 py-3 text-right">
                  <span
                    className={
                      "inline-block px-2 py-0.5 rounded text-xs font-semibold tabular-nums " +
                      (isOut
                        ? "bg-red-500/30 text-red-200"
                        : "bg-amber-500/20 text-amber-200")
                    }
                  >
                    {row.stock}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Decants view — liquid volume per product + fillable units per size
// ─────────────────────────────────────────────────────────────────────────────

interface DecantPoolRow {
  product_id: string;
  name: string;
  brand: string;
  pool_ml: number;
}

/** How many whole decants of `size` ml the pool can fill. */
function fillableUnits(poolMl: number, size: number): number {
  if (poolMl <= 0 || size <= 0) return 0;
  return Math.floor(poolMl / size);
}

function DecantsView() {
  const { data, isLoading, isError, error } = useDecantStock();

  // useDecantStock returns one row per decant VARIANT (each size repeats the
  // shared pool). Collapse to one row per product — the pool is what matters
  // here, and the 10/5/2 columns are fixed sizes independent of which variants
  // happen to exist. Sorted by remaining volume ASC (most urgent first).
  const pools = useMemo<DecantPoolRow[]>(() => {
    const byProduct = new Map<string, DecantPoolRow>();
    for (const r of (data ?? []) as DecantStockRow[]) {
      if (!byProduct.has(r.product_id)) {
        byProduct.set(r.product_id, {
          product_id: r.product_id,
          name: r.name,
          brand: r.brand,
          pool_ml: r.pool_ml,
        });
      }
    }
    return [...byProduct.values()].sort((a, b) => a.pool_ml - b.pool_ml);
  }, [data]);

  if (isLoading) return <SkeletonRows />;
  if (isError)
    return <ErrorRow message={error instanceof Error ? error.message : "Error"} />;
  if (pools.length === 0)
    return (
      <p className="px-5 py-10 text-center text-sm text-[#a5a5a5]">
        No hay productos con stock de decants todavía.
      </p>
    );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-[#a5a5a5]">
            <th className="px-5 py-2">Producto</th>
            <th className="px-5 py-2 text-right">Restante</th>
            {DECANT_SIZES_ML.map((size) => (
              <th key={size} className="px-5 py-2 text-right">
                {size} ml
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#c9a96e]/10">
          {pools.map((row) => {
            const empty = row.pool_ml <= 0;
            return (
              <tr key={row.product_id} className="text-[#ececec]">
                <td className="px-5 py-3">
                  <div className="font-medium">{row.name}</div>
                  <div className="text-xs text-[#a5a5a5]">{row.brand}</div>
                </td>
                <td className="px-5 py-3 text-right">
                  <span
                    className={
                      "inline-block px-2 py-0.5 rounded text-xs font-semibold tabular-nums " +
                      (empty
                        ? "bg-red-500/30 text-red-200"
                        : "bg-[#c9a96e]/15 text-[#c9a96e]")
                    }
                  >
                    {row.pool_ml} ml
                  </span>
                </td>
                {DECANT_SIZES_ML.map((size) => {
                  const units = fillableUnits(row.pool_ml, size);
                  return (
                    <td
                      key={size}
                      className={
                        "px-5 py-3 text-right font-semibold tabular-nums " +
                        (units <= 0 ? "text-red-400" : "text-[#ececec]")
                      }
                    >
                      {units}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared states
// ─────────────────────────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <div className="p-5 space-y-2">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-12 bg-[#c9a96e]/5 rounded animate-pulse" />
      ))}
    </div>
  );
}

function ErrorRow({ message }: { message: string }) {
  return (
    <p className="px-5 py-6 text-sm text-red-300 bg-red-500/10">
      No pudimos cargar las alertas de stock: {message}
    </p>
  );
}
