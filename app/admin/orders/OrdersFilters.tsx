"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SEARCH_PARAM, PAGE_PARAM, buildQuery } from "@/lib/pagination";
import { STATUS_PARAM, PAYMENT_PARAM } from "./params";
import type {
  OrderStatusFilter,
  PaymentStatusFilter,
} from "@/features/admin/getOrdersAdminPage";

interface Props {
  /** Current filter values, parsed from the URL by the server page. */
  search: string;
  orderStatus: OrderStatusFilter;
  paymentStatus: PaymentStatusFilter;
}

/**
 * URL-driven filter bar for /admin/orders. Search is debounced (300ms); the
 * dropdowns commit immediately. Every change writes to the query string and
 * resets `page` to 1, which re-renders the server-paginated list. Mirrors the
 * stock panel's toolbar so all admin lists share one interaction model.
 */
export default function OrdersFilters({ search, orderStatus, paymentStatus }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const spRef = useRef(searchParams);
  useEffect(() => {
    spRef.current = searchParams;
  }, [searchParams]);

  const [localSearch, setLocalSearch] = useState(search);
  const firstRun = useRef(true);

  const push = (overrides: Record<string, string | undefined>) => {
    const qs = buildQuery(new URLSearchParams(spRef.current.toString()), {
      ...overrides,
      [PAGE_PARAM]: undefined, // any filter change returns to page 1
    });
    router.push(`${pathname}${qs}`, { scroll: false });
  };

  // Debounced search → URL.
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const t = setTimeout(() => {
      const current = spRef.current.get(SEARCH_PARAM) ?? "";
      if (localSearch.trim() === current) return;
      push({ [SEARCH_PARAM]: localSearch.trim() || undefined });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSearch]);

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
            value={orderStatus}
            onChange={(e) =>
              push({
                [STATUS_PARAM]: e.target.value === "all" ? undefined : e.target.value,
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
            value={paymentStatus}
            onChange={(e) =>
              push({
                [PAYMENT_PARAM]: e.target.value === "all" ? undefined : e.target.value,
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
