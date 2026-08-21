"use client";

import { useBestSellers, type BestSellerRow } from "@/hooks/useAnalytics";
import { formatPrice } from "@/lib/format";

interface Props {
  since: Date | null;
}

/**
 * Top 10 best-selling variants in the selected period, sorted by units sold
 * (server-side via analytics_best_sellers RPC).
 *
 * Each row shows: rank, brand + product, type/size, units, revenue.
 */
export default function BestSellersTable({ since }: Props) {
  const { data, isLoading, isError, error } = useBestSellers({ since, limit: 10 });

  return (
    <section className="rounded-none border border-krov-smoke bg-krov-graphite overflow-hidden">
      <header className="px-5 py-4 border-b border-krov-smoke/70">
        <h2 className="text-base font-semibold text-krov-bone">
          Más vendidos
        </h2>
        <p className="text-xs text-krov-ash mt-0.5">
          Top 10 por unidades en el período seleccionado
        </p>
      </header>

      {isLoading ? (
        <SkeletonRows />
      ) : isError ? (
        <ErrorRow message={error instanceof Error ? error.message : "Error"} />
      ) : (data ?? []).length === 0 ? (
        <EmptyRow message="Sin ventas registradas en este período." />
      ) : (
        <Table rows={data ?? []} />
      )}
    </section>
  );
}

function Table({ rows }: { rows: BestSellerRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-krov-ash">
            <th className="px-5 py-2 w-8">#</th>
            <th className="px-5 py-2">Producto</th>
            <th className="px-5 py-2 text-right">Unidades</th>
            <th className="px-5 py-2 text-right">Ingresos</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-krov-smoke/70">
          {rows.map((row, idx) => (
            <tr key={row.variant_id} className="text-krov-bone">
              <td className="px-5 py-3 text-krov-ash tabular-nums">
                {idx + 1}
              </td>
              <td className="px-5 py-3">
                <div className="font-medium">
                  {row.brand_name} — {row.product_name}
                </div>
                <div className="text-xs text-krov-ash">
                  {row.product_type === "decant" ? "Decant" : "Full size"} ·{" "}
                  {row.size_ml} ml ·{" "}
                  <span className="font-mono">{row.sku}</span>
                </div>
              </td>
              <td className="px-5 py-3 text-right tabular-nums">
                {Number(row.total_units).toLocaleString("es-CR")}
              </td>
              <td className="px-5 py-3 text-right tabular-nums font-medium">
                {formatPrice(Number(row.total_revenue))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SkeletonRows() {
  return (
    <div className="p-5 space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-12 bg-krov-blood/5 rounded-none animate-pulse" />
      ))}
    </div>
  );
}

function EmptyRow({ message }: { message: string }) {
  return <p className="px-5 py-10 text-center text-sm text-krov-ash">{message}</p>;
}

function ErrorRow({ message }: { message: string }) {
  return (
    <p className="px-5 py-6 text-sm text-red-300 bg-red-500/10">
      No pudimos cargar el top de ventas: {message}
    </p>
  );
}
