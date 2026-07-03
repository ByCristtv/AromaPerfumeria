"use client";

import { useMemo, useState } from "react";
import BestSellersTable from "./BestSellersTable";
import DateRangePicker, {
  presetToDate,
  type DatePreset,
} from "./DateRangePicker";
import KpiCards from "./KpiCards";
import LowStockTable from "./LowStockTable";
import AdminContainer from "@/components/admin/ui/AdminContainer";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";

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
    <AdminContainer>
      <AdminPageHeader
        eyebrow="Analítica"
        title="Mis Ventas"
        description="Ingresos, productos más vendidos y alertas de inventario."
        actions={<DateRangePicker value={preset} onChange={setPreset} />}
      />

      <div className="space-y-5">
        <KpiCards since={since} />
        <BestSellersTable since={since} />
        <LowStockTable />
      </div>
    </AdminContainer>
  );
}
