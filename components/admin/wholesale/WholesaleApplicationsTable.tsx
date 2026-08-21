"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { Check, X, ExternalLink } from "lucide-react";
import { reviewWholesaleApplicationAction } from "@/app/admin/wholesale/actions";
import type { WholesaleApplicationAdminRow } from "@/features/admin/getWholesaleApplications";

const STATUS_META: Record<string, { label: string; cls: string }> = {
  pending: { label: "Pendiente", cls: "bg-amber-500/15 text-amber-300" },
  approved: { label: "Aprobada", cls: "bg-emerald-500/15 text-emerald-300" },
  rejected: { label: "Rechazada", cls: "bg-red-500/15 text-red-300" },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("es-CR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function WholesaleApplicationsTable({
  rows,
}: {
  rows: WholesaleApplicationAdminRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // Which user_id is mid-review, so only its buttons show the disabled state.
  const [activeId, setActiveId] = useState<string | null>(null);

  const review = async (
    row: WholesaleApplicationAdminRow,
    decision: "approved" | "rejected"
  ) => {
    const confirm = await Swal.fire({
      icon: decision === "approved" ? "question" : "warning",
      title:
        decision === "approved"
          ? `¿Aprobar a ${row.company_name}?`
          : `¿Rechazar a ${row.company_name}?`,
      text:
        decision === "approved"
          ? "La cuenta pasará a mayorista y verá precios mayoristas."
          : "La solicitud quedará rechazada. El cliente podrá volver a aplicar.",
      showCancelButton: true,
      confirmButtonText: decision === "approved" ? "Aprobar" : "Rechazar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: decision === "approved" ? "#059669" : "#dc2626",
      cancelButtonColor: "#3f3f46",
    });
    if (!confirm.isConfirmed) return;

    setActiveId(row.user_id);
    startTransition(async () => {
      const result = await reviewWholesaleApplicationAction(row.user_id, decision);
      setActiveId(null);

      await Swal.fire({
        icon: result.ok ? "success" : "error",
        title: result.ok ? "Listo" : "Error",
        text: result.message,
        confirmButtonColor: "#ff4d74",
      });

      if (result.ok) router.refresh();
    });
  };

  if (rows.length === 0) {
    return (
      <div className="rounded-none border border-krov-smoke bg-krov-graphite p-12 text-center">
        <p className="text-krov-ash">No hay solicitudes de cuenta mayorista.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-none border border-krov-smoke bg-krov-graphite">
      {/* Desktop table */}
      <table className="hidden w-full text-left text-sm md:table">
        <thead>
          <tr className="border-b border-krov-smoke/85 text-xs uppercase tracking-wider text-krov-ash">
            <th className="px-5 py-4 font-medium">Empresa</th>
            <th className="px-5 py-4 font-medium">Cédula / RUC</th>
            <th className="px-5 py-4 font-medium">Actividad</th>
            <th className="px-5 py-4 font-medium">Estado</th>
            <th className="px-5 py-4 font-medium">Solicitado</th>
            <th className="px-5 py-4 font-medium text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const meta = STATUS_META[row.application_status] ?? {
              label: row.application_status,
              cls: "bg-white/10 text-white/70",
            };
            const busy = isPending && activeId === row.user_id;
            return (
              <tr
                key={row.user_id}
                className="border-b border-white/5 transition-colors last:border-0 hover:bg-white/[0.03]"
              >
                <td className="px-5 py-4">
                  <span className="font-medium text-krov-bone">
                    {row.company_name}
                  </span>
                  {row.applicant_name && (
                    <span className="block text-xs text-krov-ash">
                      {row.applicant_name}
                    </span>
                  )}
                  {row.website && (
                    <a
                      href={row.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-0.5 inline-flex items-center gap-1 text-xs text-krov-rose hover:underline"
                    >
                      <ExternalLink size={11} aria-hidden /> Sitio web
                    </a>
                  )}
                </td>
                <td className="px-5 py-4 tabular-nums text-krov-ash">
                  {row.tax_id}
                </td>
                <td className="px-5 py-4 max-w-xs text-krov-ash">
                  {row.business_activity ?? "—"}
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${meta.cls}`}
                  >
                    {meta.label}
                  </span>
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-krov-ash">
                  {formatDate(row.created_at)}
                </td>
                <td className="px-5 py-4">
                  <RowActions
                    status={row.application_status}
                    busy={busy}
                    onApprove={() => review(row, "approved")}
                    onReject={() => review(row, "rejected")}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Mobile cards */}
      <div className="divide-y divide-white/5 md:hidden">
        {rows.map((row) => {
          const meta = STATUS_META[row.application_status] ?? {
            label: row.application_status,
            cls: "bg-white/10 text-white/70",
          };
          const busy = isPending && activeId === row.user_id;
          return (
            <div key={row.user_id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-krov-bone">{row.company_name}</p>
                  <p className="text-xs text-krov-ash">{row.tax_id}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${meta.cls}`}
                >
                  {meta.label}
                </span>
              </div>
              {row.business_activity && (
                <p className="mt-2 text-xs text-krov-ash">{row.business_activity}</p>
              )}
              <div className="mt-3">
                <RowActions
                  status={row.application_status}
                  busy={busy}
                  onApprove={() => review(row, "approved")}
                  onReject={() => review(row, "rejected")}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RowActions({
  status,
  busy,
  onApprove,
  onReject,
}: {
  status: string;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  // Terminal states can still be re-decided (e.g. reject an approved account),
  // but the default queue action is to resolve pending ones.
  const canApprove = status !== "approved";
  const canReject = status !== "rejected";

  return (
    <div className="flex items-center justify-end gap-2">
      {canApprove && (
        <button
          type="button"
          onClick={onApprove}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-none border border-emerald-500/40 px-3 py-1.5 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/10 disabled:opacity-40"
        >
          <Check size={13} aria-hidden /> Aprobar
        </button>
      )}
      {canReject && (
        <button
          type="button"
          onClick={onReject}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-none border border-red-500/40 px-3 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-500/10 disabled:opacity-40"
        >
          <X size={13} aria-hidden /> Rechazar
        </button>
      )}
    </div>
  );
}
