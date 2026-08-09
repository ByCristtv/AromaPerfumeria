import { Gift } from "lucide-react";
import AdminContainer from "@/components/admin/ui/AdminContainer";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import { adminSerif } from "@/components/admin/ui/styles";

/**
 * Admin → Recompensas.
 *
 * Placeholder page for the future rewards system (benefits tied to customer
 * ranks). Authorization is enforced in `proxy.ts`, which redirects any non-admin
 * request away from `/admin/*` before this Server Component runs.
 *
 * Intentionally UI-only: the reward model, eligibility and redemption rules are
 * not defined yet, so this page ships no data access, tables, RPCs or business
 * logic — just the navigation entry and a coming-soon state so the section can
 * be filled in once the requirements exist.
 */
export default function AdminRewardsPage() {
  return (
    <AdminContainer width="narrow">
      <AdminPageHeader
        eyebrow="Fidelidad"
        title="Recompensas"
        description="Configura los beneficios asociados a cada rango de cliente."
      />

      <div className="flex flex-col items-center rounded-2xl border border-[#c9a96e]/20 bg-[#141414] px-6 py-16 text-center shadow-[0_18px_64px_rgba(0,0,0,0.35)]">
        <span className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-[#c9a96e]/25 bg-[#c9a96e]/[0.06] text-[#c9a96e]">
          <Gift size={30} strokeWidth={1.5} aria-hidden />
        </span>

        <span className="mb-3 inline-flex items-center rounded-full border border-[#c9a96e]/30 bg-[#c9a96e]/[0.06] px-3.5 py-1.5 text-[10px] uppercase tracking-[0.35em] text-[#c9a96e]">
          Próximamente
        </span>

        <h2
          className="text-2xl text-[#ececec] sm:text-3xl"
          style={{ fontFamily: adminSerif }}
        >
          En desarrollo
        </h2>

        <p className="mt-3 max-w-md text-sm leading-relaxed text-[#a5a5a5]">
          Esta función se encuentra actualmente en desarrollo. Pronto podrás
          configurar recompensas para los distintos rangos y niveles de tus
          clientes desde este panel.
        </p>
      </div>
    </AdminContainer>
  );
}
