import { getStockMovements } from "@/features/admin/getStockMovements";
import {
  parsePage,
  parseSearch,
  type RawSearchParams,
} from "@/lib/pagination";
import StockToolbar from "@/components/admin/stock/StockToolbar";
import StockMovementsTable from "@/components/admin/stock/StockMovementsTable";
import Pagination from "@/components/admin/ui/Pagination";
import AdminContainer from "@/components/admin/ui/AdminContainer";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";

/**
 * Admin → Movimientos de Stock.
 *
 * Authorization is enforced in `proxy.ts` (non-admins are redirected away from
 * `/admin/*` before this Server Component runs), so no duplicate gate here.
 *
 * The data is fetched server-side with the request-bound Supabase client, which
 * makes the panel server-rendered + URL-driven (search `?q=`, `?page=`). The
 * interactive pieces — search box, pagination links, and the bulk-stock modal —
 * are small client islands.
 *
 * Next.js 16: `searchParams` is async and MUST be awaited.
 */
interface AdminStockPageProps {
  searchParams: Promise<RawSearchParams>;
}

export default async function AdminStockPage({ searchParams }: AdminStockPageProps) {
  const sp = await searchParams;
  const search = parseSearch(sp);
  const page = parsePage(sp);

  const { rows, total, currentPage, totalPages, pageSize } =
    await getStockMovements(page, search);

  const from = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, total);

  return (
    <AdminContainer>
      <AdminPageHeader
        eyebrow="Inventario"
        title="Movimientos de Stock"
        description="Historial completo de cambios de inventario y registro de entradas en lote."
      />

      <StockToolbar initialSearch={search ?? ""} />

      <p className="mb-4 mt-6 text-xs uppercase tracking-[0.2em] text-[#a5a5a5]">
        {total === 0
          ? "Sin movimientos"
          : `Mostrando ${from}–${to} de ${total}`}
      </p>

      <StockMovementsTable rows={rows} />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        label="Paginación de movimientos"
      />
    </AdminContainer>
  );
}
