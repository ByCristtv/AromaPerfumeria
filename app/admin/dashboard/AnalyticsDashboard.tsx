"use client";

import { useMemo, useState } from "react";
import BestSellersTable from "./BestSellersTable";
import DateRangePicker, {
  presetToDate,
  type DatePreset,
} from "./DateRangePicker";
import KpiCards from "./KpiCards";
import LowStockTable from "./LowStockTable";

/**
 * Client orchestrator for the analytics dashboard. Owns the date-range
 * preset state and derives the Date passed to KpiCards + BestSellersTable.
 *
 * LowStockTable is independent — stock state is "now," not a date range.
 *
 * Default preset is 30 days. useMemo on the derived Date prevents the
 * children's queryKeys from invalidating every render (since presetToDate
 * builds a fresh Date object based on Date.now()).
 */
export default function AnalyticsDashboard() {
  const [preset, setPreset] = useState<DatePreset>("30d");

  // Re-derive only when preset changes. Without useMemo, a new Date object
  // would be created on every render → new queryKey → constant refetch.
  const since = useMemo(() => presetToDate(preset), [preset]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-6 mt-3">
        <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-[#ececec] tracking-wide">
              Mis Ventas
            </h1>
            <p className="text-[#a5a5a5] mt-1">
              Ingresos, productos más vendidos y alertas de inventario
            </p>
          </div>
          <DateRangePicker value={preset} onChange={setPreset} />
        </header>

        <div className="space-y-5">
          <KpiCards since={since} />
          <BestSellersTable since={since} />
          <LowStockTable />
        </div>
      </div>
    </div>
  );
}
