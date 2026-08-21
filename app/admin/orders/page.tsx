import type { Metadata } from "next";
import Link from "next/link";
import OrdersFilters from "./OrdersFilters";
import OrdersTable from "./OrdersTable";
import { STATUS_PARAM, PAYMENT_PARAM } from "./params";
import AdminContainer from "@/components/admin/ui/AdminContainer";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import Pagination from "@/components/admin/ui/Pagination";
import {
  getOrdersAdminPage,
  type OrderStatusFilter,
  type PaymentStatusFilter,
} from "@/features/admin/getOrdersAdminPage";
import {
  parsePage,
  parseParam,
  parseSearch,
  paginate,
  type RawSearchParams,
} from "@/lib/pagination";

export const metadata: Metadata = {
  title: "Órdenes — Admin",
  description: "Gestión de pedidos.",
};

export const dynamic = "force-dynamic";

const ORDER_STATUSES: OrderStatusFilter[] = [
  "all",
  "pending",
  "received",
  "shipped",
  "denied",
];
const PAYMENT_STATUSES: PaymentStatusFilter[] = [
  "all",
  "pending",
  "paid",
  "failed",
  "refunded",
];

function coerce<T extends string>(value: string, allowed: T[], fallback: T): T {
  return (allowed as string[]).includes(value) ? (value as T) : fallback;
}

/**
 * Admin → Orders list. Auth is enforced by proxy.ts before this renders. The list
 * is fetched + paginated server-side (20/page, URL-driven `?q=`/`?status=`/
 * `?payment=`/`?page=`); the filter bar is a small client island.
 *
 * Next.js 16: `searchParams` is async and MUST be awaited.
 */
interface AdminOrdersPageProps {
  searchParams: Promise<RawSearchParams>;
}

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  const sp = await searchParams;
  const search = parseSearch(sp);
  const page = parsePage(sp);
  const orderStatus = coerce(parseParam(sp, STATUS_PARAM, "all"), ORDER_STATUSES, "all");
  const paymentStatus = coerce(
    parseParam(sp, PAYMENT_PARAM, "all"),
    PAYMENT_STATUSES,
    "all"
  );

  const { rows, total, currentPage, totalPages, pageSize } = await getOrdersAdminPage(
    page,
    { search, orderStatus, paymentStatus }
  );

  const { from, to } = paginate(total, currentPage, pageSize);

  return (
    <AdminContainer>
      <AdminPageHeader
        eyebrow="Pedidos"
        title="Órdenes"
        description="Gestiona los pedidos de tus clientes."
        actions={
          <Link
            href="/admin/orders/new"
            className="inline-flex items-center gap-2 rounded-none bg-krov-blood px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-krov-crimson"
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
        }
      />

      <OrdersFilters
        search={search ?? ""}
        orderStatus={orderStatus}
        paymentStatus={paymentStatus}
      />

      <p className="mb-4 mt-6 text-xs uppercase tracking-[0.2em] text-krov-ash">
        {total === 0 ? "Sin pedidos" : `Mostrando ${from}–${to} de ${total}`}
      </p>

      <OrdersTable orders={rows} />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        label="Paginación de pedidos"
      />
    </AdminContainer>
  );
}
