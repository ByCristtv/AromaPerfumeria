"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/format";
import type { AdminOrderRow } from "@/features/admin/getOrdersAdminPage";

interface Props {
  orders: AdminOrderRow[];
}

export default function OrdersTable({ orders }: Props) {
  const router = useRouter();
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
              // The whole row navigates to the order for a larger click target.
              // The <Link> below stays the semantic, keyboard-focusable target;
              // this handler is a mouse enhancement, and the guard lets any
              // future interactive control inside the row keep its own action.
              onClick={(e) => {
                if ((e.target as HTMLElement).closest("a, button, input, select"))
                  return;
                router.push(`/admin/orders/${o.id}`);
              }}
              className="cursor-pointer text-[#ececec] transition hover:bg-[#c9a96e]/5 focus-within:bg-[#c9a96e]/5"
            >
              <td className="px-4 py-3">
                <Link
                  href={`/admin/orders/${o.id}`}
                  className="rounded font-mono text-[#c9a96e] hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-[#c9a96e]/70"
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
