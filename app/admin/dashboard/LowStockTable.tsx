"use client";

import { useLowStock, type LowStockRow } from "@/hooks/useAnalytics";

interface Props {
  threshold?: number;
}

/**
 * Variants at or below the stock threshold, sorted by stock ASC (most urgent
 * first, done server-side by analytics_low_stock).
 *
 * threshold defaults to 5 (matches RPC default). Lifted to a prop in case
 * the dashboard ever wants a slider; not exposed in UI for v1.
 *
 * Empty state ("no alerts") is intentionally celebratory — admins land on
 * this dashboard often, and a "no warnings" view is good news.
 */
export default function LowStockTable({ threshold = 5 }: Props) {
  const { data, isLoading, isError, error } = useLowStock({ threshold });

  return (
    <section className="rounded-2xl border border-[#c9a96e]/20 bg-[#1a1a1a] overflow-hidden">
      <header className="px-5 py-4 border-b border-[#c9a96e]/10">
        <h2 className="text-base font-semibold text-[#ececec]">Bajo stock</h2>
        <p className="text-xs text-[#a5a5a5] mt-0.5">
          Variantes con ≤ {threshold} unidades disponibles
        </p>
      </header>

      {isLoading ? (
        <SkeletonRows />
      ) : isError ? (
        <ErrorRow message={error instanceof Error ? error.message : "Error"} />
      ) : (data ?? []).length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-emerald-300">
          Sin alertas. Todo tu inventario está sobre el umbral.
        </p>
      ) : (
        <Table rows={data ?? []} />
      )}
    </section>
  );
}

function Table({ rows }: { rows: LowStockRow[] }) {
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
                    {{
                      decant: "Decant",
                      set: "Set",
                      full_size: "Full size"
                    }[row.product_type] || "Desconocido"} ·{" "}
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
