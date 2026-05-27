"use client";

import { useRevenueSummary } from "@/hooks/useAnalytics";
import { formatPrice } from "@/lib/format";

interface Props {
  since: Date | null;
}

/**
 * Four KPI cards driven by analytics_revenue_summary.
 *
 * RPC returns 0 rows when there are no orders matching → we display zeros
 * rather than a blank state. Loading shows skeleton bars; error shows a
 * compact red strip across all four cards so the layout doesn't jump.
 */
export default function KpiCards({ since }: Props) {
  const { data, isLoading, isError, error } = useRevenueSummary({ since });

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
        No pudimos cargar los KPIs:{" "}
        {error instanceof Error ? error.message : "error desconocido"}
      </div>
    );
  }

  // Treat "no rows" as all-zero so cards still render meaningfully.
  const revenue = data?.gross_revenue ?? 0;
  const orders = data?.total_orders ?? 0;
  const units = data?.total_units ?? 0;
  const aov = data?.avg_order_value ?? 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <Card label="Ingresos" value={formatPrice(revenue)} loading={isLoading} />
      <Card label="Pedidos" value={orders.toLocaleString("es-CR")} loading={isLoading} />
      <Card label="Unidades" value={units.toLocaleString("es-CR")} loading={isLoading} />
      <Card label="Promedio" value={formatPrice(aov)} loading={isLoading} />
    </div>
  );
}

function Card({
  label,
  value,
  loading,
}: {
  label: string;
  value: string;
  loading?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[#c9a96e]/20 bg-[#1a1a1a] p-4 sm:p-5">
      <p className="text-[11px] uppercase tracking-wider text-[#a5a5a5]">{label}</p>
      {loading ? (
        <div className="mt-2 h-7 w-2/3 bg-[#c9a96e]/10 rounded animate-pulse" />
      ) : (
        <p className="mt-1 text-2xl font-bold text-[#ececec] tabular-nums">
          {value}
        </p>
      )}
    </div>
  );
}
