import type { Metadata } from "next";
import AdminProductsView from "@/components/admin/AdminProductsView";
import { getProductsAdminPage } from "@/features/admin/getProductsAdminPage";
import { parsePage, parseSearch, paginate, type RawSearchParams } from "@/lib/pagination";

export const metadata: Metadata = {
  title: "Productos — Admin",
  description: "Gestión del catálogo de productos.",
};

// Admin data is per-request (auth-gated + always fresh); never statically cached.
export const dynamic = "force-dynamic";

/**
 * Admin → Products page.
 *
 * Authorization is enforced in `proxy.ts`, which redirects any non-admin request
 * away from `/admin/*` before this Server Component runs. The variants table is
 * fetched + paginated server-side (20/page, URL-driven `?q=` / `?page=`); all
 * interactive state (search box, modals, row actions) lives in the client
 * `AdminProductsView` island.
 *
 * Next.js 16: `searchParams` is async and MUST be awaited.
 */
interface AdminProductsPageProps {
  searchParams: Promise<RawSearchParams>;
}

export default async function AdminProductsPage({ searchParams }: AdminProductsPageProps) {
  const sp = await searchParams;
  const search = parseSearch(sp);
  const page = parsePage(sp);

  const { rows, total, currentPage, totalPages, pageSize } =
    await getProductsAdminPage(page, search);

  const { from, to } = paginate(total, currentPage, pageSize);

  return (
    <AdminProductsView
      rows={rows}
      initialSearch={search ?? ""}
      currentPage={currentPage}
      totalPages={totalPages}
      total={total}
      from={from}
      to={to}
    />
  );
}
