import { getWholesaleApplications } from "@/features/admin/getWholesaleApplications";
import AdminContainer from "@/components/admin/ui/AdminContainer";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import WholesaleApplicationsTable from "@/components/admin/wholesale/WholesaleApplicationsTable";

/**
 * Admin → Cuentas mayoristas.
 *
 * Authorization lives in proxy.ts (non-admins are redirected away from /admin/*
 * before this Server Component runs) and, for the approve/reject mutations, in
 * the review_wholesale_application() RPC's internal is_admin() guard.
 *
 * Server-rendered from the request-bound Supabase client; the approve/reject
 * buttons are a small client island.
 */
export default async function AdminWholesalePage() {
  const rows = await getWholesaleApplications();
  const pendingCount = rows.filter(
    (r) => r.application_status === "pending"
  ).length;

  return (
    <AdminContainer>
      <AdminPageHeader
        eyebrow="Clientes"
        title="Cuentas mayoristas"
        description="Revisa y aprueba las solicitudes de cuenta mayorista (B2B). Aprobar promueve la cuenta a precios mayoristas."
      />

      <p className="mb-4 text-xs uppercase tracking-[0.2em] text-krov-ash">
        {pendingCount === 0
          ? "Sin solicitudes pendientes"
          : `${pendingCount} ${
              pendingCount === 1 ? "solicitud pendiente" : "solicitudes pendientes"
            }`}
      </p>

      <WholesaleApplicationsTable rows={rows} />
    </AdminContainer>
  );
}
