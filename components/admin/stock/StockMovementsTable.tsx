import type { StockMovementRow, StockMovementReason } from "@/types/stockMovement";

const REASON_LABELS: Record<StockMovementReason, string> = {
  manual_adjustment: "Ajuste manual",
  order_placed: "Venta",
  order_cancelled: "Cancelación",
  restock: "Reabastecimiento",
  correction: "Corrección",
  return: "Devolución",
  transformed_to_decant: "Transformado a decant",
};

const REASON_STYLES: Record<StockMovementReason, string> = {
  manual_adjustment: "bg-white/10 text-white/70",
  order_placed: "bg-blue-500/15 text-blue-300",
  order_cancelled: "bg-amber-500/15 text-amber-300",
  restock: "bg-emerald-500/15 text-emerald-300",
  correction: "bg-purple-500/15 text-purple-300",
  return: "bg-amber-500/15 text-amber-300",
  transformed_to_decant: "bg-krov-blood/15 text-krov-rose",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("es-CR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Signed integer/decimal with a leading + for positive deltas. */
function signed(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}

/**
 * Build the human label + the before→after / change strings for one movement,
 * collapsing the variant-vs-pool dual mode into a single presentation.
 */
function describe(row: StockMovementRow) {
  const isPool = row.variant_id === null && row.product_id !== null;

  if (isPool) {
    const delta = Number(row.ml_delta ?? 0);
    return {
      unit: "Pool de decants",
      change: `${signed(delta)} ml`,
      positive: delta >= 0,
      before: `${row.previous_ml ?? "—"} ml`,
      after: `${row.new_ml ?? "—"} ml`,
    };
  }

  const delta = Number(row.delta ?? 0);
  const size = row.size_ml ? `${row.size_ml}ml` : null;
  const unit = [row.sku, size].filter(Boolean).join(" · ") || "Variante";
  return {
    unit,
    change: `${signed(delta)} u`,
    positive: delta >= 0,
    before: `${row.previous_stock ?? "—"}`,
    after: `${row.new_stock ?? "—"}`,
  };
}

/**
 * Presentational data table for stock movements (Server Component). Pagination
 * and search are owned by the surrounding URL-driven page, so this component is
 * a pure render of the current page's rows. Responsive: a real table on desktop,
 * stacked cards on mobile.
 */
export default function StockMovementsTable({
  rows,
}: {
  rows: StockMovementRow[];
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-none border border-krov-smoke bg-krov-graphite p-12 text-center">
        <p className="text-krov-ash">No se encontraron movimientos de stock.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-none border border-krov-smoke bg-krov-graphite">
      {/* Desktop table */}
      <table className="hidden w-full text-left text-sm md:table">
        <thead>
          <tr className="border-b border-krov-smoke/85 text-xs uppercase tracking-wider text-krov-ash">
            <th className="px-5 py-4 font-medium">Fecha</th>
            <th className="px-5 py-4 font-medium">Producto</th>
            <th className="px-5 py-4 font-medium">Variante</th>
            <th className="px-5 py-4 font-medium text-right">Cambio</th>
            <th className="px-5 py-4 font-medium text-right">Antes → Después</th>
            <th className="px-5 py-4 font-medium">Motivo</th>
            <th className="px-5 py-4 font-medium">Por</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const d = describe(row);
            return (
              <tr
                key={row.id}
                className="border-b border-white/5 transition-colors last:border-0 hover:bg-white/[0.03]"
              >
                <td className="px-5 py-4 whitespace-nowrap text-krov-ash">
                  {formatDate(row.created_at)}
                </td>
                <td className="px-5 py-4">
                  <span className="font-medium text-krov-bone">
                    {row.product_name ?? "Producto eliminado"}
                  </span>
                  {row.brand_name && (
                    <span className="block text-xs text-krov-ash">
                      {row.brand_name}
                    </span>
                  )}
                </td>
                <td className="px-5 py-4 text-krov-ash">{d.unit}</td>
                <td
                  className={`px-5 py-4 text-right font-bold tabular-nums ${
                    d.positive ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {d.change}
                </td>
                <td className="px-5 py-4 text-right tabular-nums text-krov-bone">
                  {d.before} <span className="text-krov-ash">→</span> {d.after}
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${REASON_STYLES[row.reason]}`}
                    title={row.notes ?? undefined}
                  >
                    {REASON_LABELS[row.reason]}
                  </span>
                </td>
                <td className="px-5 py-4 text-krov-ash">
                  {row.performed_by_name || "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Mobile cards */}
      <div className="divide-y divide-white/5 md:hidden">
        {rows.map((row) => {
          const d = describe(row);
          return (
            <div key={row.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-krov-bone">
                    {row.product_name ?? "Producto eliminado"}
                  </p>
                  <p className="text-xs text-krov-ash">{d.unit}</p>
                </div>
                <span
                  className={`shrink-0 font-bold tabular-nums ${
                    d.positive ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {d.change}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span
                  className={`rounded-full px-2.5 py-1 font-medium ${REASON_STYLES[row.reason]}`}
                >
                  {REASON_LABELS[row.reason]}
                </span>
                <span className="text-krov-ash">
                  {d.before} → {d.after}
                </span>
                <span className="text-krov-ash">· {formatDate(row.created_at)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
