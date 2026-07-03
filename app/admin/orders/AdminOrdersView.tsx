"use client";

import { useState } from "react";
import Link from "next/link";
import OrdersFilters from "./OrdersFilters";
import OrdersTable from "./OrdersTable";
import AdminContainer from "@/components/admin/ui/AdminContainer";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import {
  useAdminOrdersList,
  type OrderStatusFilter,
  type PaymentStatusFilter,
} from "@/hooks/useAdminOrdersList";

export interface Filters {
  search: string;
  orderStatus: OrderStatusFilter;
  paymentStatus: PaymentStatusFilter;
}

const INITIAL_FILTERS: Filters = {
  search: "",
  orderStatus: "all",
  paymentStatus: "all",
};

/**
 * Client orchestrator for the admin orders list. Owns the filter state and
 * passes it to <OrdersFilters /> + the data hook.
 *
 * We keep filter state in component state (not URL) for v1 simplicity. If you
 * later want shareable URLs ("here's the list of denied orders this month"),
 * sync to searchParams via useRouter + URL params.
 */
export default function AdminOrdersView() {
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const { data, isLoading, isError, error, isFetching } = useAdminOrdersList(filters);

  return (
    <AdminContainer>
      <AdminPageHeader
        eyebrow="Pedidos"
        title="Órdenes"
        description="Gestiona los pedidos de tus clientes."
        actions={
          <>
            {isFetching && !isLoading && (
              <span className="text-xs text-[#a5a5a5]">Actualizando…</span>
            )}
            <Link
              href="/admin/orders/new"
              className="inline-flex items-center gap-2 rounded-lg bg-[#c9a96e] px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-[#b8a060]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M12 5v14M5 12h14"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
              Crear Orden
            </Link>
          </>
        }
      />

      <OrdersFilters value={filters} onChange={setFilters} />

      <div className="mt-6">
        {isLoading ? (
          <SkeletonState />
        ) : isError ? (
          <ErrorState error={error} />
        ) : (
          <OrdersTable orders={data ?? []} />
        )}
      </div>
    </AdminContainer>
  );
}

function SkeletonState() {
  return (
    <div className="rounded-2xl border border-[#c9a96e]/20 bg-[#1a1a1a] p-12 text-center text-[#a5a5a5]">
      Cargando órdenes…
    </div>
  );
}

function ErrorState({ error }: { error: unknown }) {
  const msg =
    error instanceof Error ? error.message : "Error desconocido al cargar las órdenes.";
  return (
    <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-200">
      <p className="font-medium mb-1">No pudimos cargar las órdenes</p>
      <p className="text-sm text-red-300/80">{msg}</p>
    </div>
  );
}
