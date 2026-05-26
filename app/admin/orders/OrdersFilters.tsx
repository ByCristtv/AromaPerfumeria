"use client";

import { useEffect, useState } from "react";
import type {
  OrderStatusFilter,
  PaymentStatusFilter,
} from "@/hooks/useAdminOrdersList";
import type { Filters } from "./AdminOrdersView";

interface Props {
  value: Filters;
  onChange: (next: Filters) => void;
}

/**
 * Filter bar: search (debounced 300ms), order status, payment status.
 *
 * Search is debounced internally so the query doesn't refetch on every
 * keystroke — only after the user stops typing. The dropdowns commit
 * immediately since they're discrete choices.
 */
export default function OrdersFilters({ value, onChange }: Props) {
  // Local input state for the debounced search.
  const [localSearch, setLocalSearch] = useState(value.search);

  useEffect(() => {
    if (localSearch === value.search) return;
    const t = setTimeout(() => {
      onChange({ ...value, search: localSearch });
    }, 300);
    return () => clearTimeout(t);
  }, [localSearch, value, onChange]);

  return (
    <div className="rounded-2xl border border-[#c9a96e]/20 bg-[#1a1a1a] p-4 sm:p-5">
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px_180px] gap-3 sm:gap-4 items-end">
        <Field id="search" label="Buscar">
          <input
            id="search"
            type="text"
            placeholder="Nombre, email, teléfono o #pedido"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className={inputCls}
          />
        </Field>

        <Field id="orderStatus" label="Estado del pedido">
          <select
            id="orderStatus"
            value={value.orderStatus}
            onChange={(e) =>
              onChange({
                ...value,
                orderStatus: e.target.value as OrderStatusFilter,
              })
            }
            className={inputCls}
          >
            <option value="all">Todos</option>
            <option value="pending">Pendiente</option>
            <option value="received">Recibido</option>
            <option value="shipped">Enviado</option>
            <option value="denied">Cancelado</option>
          </select>
        </Field>

        <Field id="paymentStatus" label="Pago">
          <select
            id="paymentStatus"
            value={value.paymentStatus}
            onChange={(e) =>
              onChange({
                ...value,
                paymentStatus: e.target.value as PaymentStatusFilter,
              })
            }
            className={inputCls}
          >
            <option value="all">Todos</option>
            <option value="pending">Pendiente</option>
            <option value="paid">Pagado</option>
            <option value="failed">Fallido</option>
            <option value="refunded">Reembolsado</option>
          </select>
        </Field>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-[11px] uppercase tracking-wider text-[#a5a5a5] mb-1.5"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-[#c9a96e]/30 bg-[#0a0a0a] px-3 py-2.5 text-sm text-[#ececec] " +
  "placeholder:text-[#666] focus:outline-none focus:ring-2 focus:ring-[#c9a96e]/40 focus:border-[#c9a96e]";
