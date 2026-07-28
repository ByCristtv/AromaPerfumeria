"use client";

import Link from "next/link";
import { formatPrice } from "@/lib/format";
import type { AdminOrderRow } from "@/features/admin/getOrdersAdminPage";

interface Props {
  orders: AdminOrderRow[];
}

export default function OrdersTable({ orders }: Props) {
  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-[#c9a96e]/20 bg-[#1a1a1a] p-12 text-center text-[#a5a5a5]">
        No hay órdenes que coincidan con los filtros.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-[#c9a96e]/20 bg-[#1a1a1a]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#c9a96e]/20 text-left text-[11px] uppercase tracking-wider text-[#a5a5a5]">
            <th className="px-4 py-3">#Pedido</th>
            <th className="px-4 py-3">Cliente</th>
            <th className="px-4 py-3 text-right">Total</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3">Pago</th>
            <th className="px-4 py-3">Origen</th>
            <th className="px-4 py-3">Fecha</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#c9a96e]/10">
          {orders.map((o) => (
            <tr
              key={o.id}
              className="text-[#ececec] hover:bg-[#c9a96e]/5 transition"
            >
              <td className="px-4 py-3">
                <Link
                  href={`/admin/orders/${o.id}`}
                  className="font-mono text-[#c9a96e] hover:underline"
                >
                  #{o.order_number}
                </Link>
              </td>
              <td className="px-4 py-3">
                <div className="font-medium">{o.customer_name}</div>
                <div className="text-xs text-[#a5a5a5]">
                  {o.customer_email ?? o.customer_phone}
                </div>
              </td>
              <td className="px-4 py-3 text-right tabular-nums font-medium">
                {formatPrice(o.total)}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={o.order_status} />
              </td>
              <td className="px-4 py-3">
                <PaymentBadge status={o.payment_status} />
              </td>
              <td className="px-4 py-3 text-xs text-[#a5a5a5]">{o.source}</td>
              <td className="px-4 py-3 text-xs text-[#a5a5a5] whitespace-nowrap">
                {formatDate(o.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Badges + formatting
// ─────────────────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    pending: ["Pendiente", "bg-amber-500/20 text-amber-200"],
    received: ["Recibido", "bg-blue-500/20 text-blue-200"],
    shipped: ["Enviado", "bg-emerald-500/20 text-emerald-200"],
    denied: ["Cancelado", "bg-red-500/20 text-red-200"],
  };
  const [label, cls] = map[status] ?? [status, "bg-gray-500/20 text-gray-200"];
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${cls}`}
    >
      {label}
    </span>
  );
}

function PaymentBadge({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    pending: ["Pendiente", "bg-amber-500/20 text-amber-200"],
    paid: ["Pagado", "bg-emerald-500/20 text-emerald-200"],
    failed: ["Fallido", "bg-red-500/20 text-red-200"],
    refunded: ["Reembolsado", "bg-purple-500/20 text-purple-200"],
  };
  const [label, cls] = map[status] ?? [status, "bg-gray-500/20 text-gray-200"];
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${cls}`}
    >
      {label}
    </span>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
