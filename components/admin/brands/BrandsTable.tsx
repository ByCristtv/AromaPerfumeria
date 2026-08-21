"use client";

import Swal from "sweetalert2";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  deleteBrand,
  ADMIN_BRANDS_QUERY_KEY,
  type BrandRow,
} from "@/features/brands/brandsAdmin";
import { BRANDS_QUERY_KEY } from "@/hooks/useBrands";

interface BrandsTableProps {
  rows: BrandRow[];
  /** 1-based current page. */
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onEdit: (brand: BrandRow) => void;
}

/**
 * Paginated brand table with edit / delete row actions. Pagination is fully
 * client-side (the whole list is already in memory via React Query) — 20 rows
 * per page, matching the catalog admin convention.
 */
export default function BrandsTable({
  rows,
  page,
  totalPages,
  onPageChange,
  onEdit,
}: BrandsTableProps) {
  const queryClient = useQueryClient();

  const handleDelete = async (brand: BrandRow) => {
    const result = await Swal.fire({
      title: "¿Eliminar marca?",
      html: `Vas a eliminar <b>${escapeHtml(brand.name)}</b>. Esta acción no se puede deshacer.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#2a2130",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) return;

    try {
      await deleteBrand(brand.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ADMIN_BRANDS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: BRANDS_QUERY_KEY }),
      ]);
      Swal.fire({
        icon: "success",
        title: "Marca eliminada",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "No se pudo eliminar",
        text: err instanceof Error ? err.message : "Error desconocido",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto rounded-none border border-krov-blood/30 bg-black shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
        <table className="min-w-full text-left text-sm text-krov-bone">
          <thead className="bg-krov-graphite text-xs uppercase tracking-wider text-krov-rose">
            <tr>
              <th className="px-5 py-3">Marca</th>
              <th className="px-5 py-3">Slug</th>
              <th className="px-5 py-3">Descripción</th>
              <th className="px-5 py-3">Estado</th>
              <th className="px-5 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((brand) => (
              <tr
                key={brand.id}
                className="border-t border-krov-smoke/70 transition-colors hover:bg-krov-graphite/60"
              >
                <td className="px-5 py-3 font-medium">{brand.name}</td>
                <td className="px-5 py-3 font-mono text-xs text-krov-ash">
                  {brand.slug}
                </td>
                <td className="max-w-xs truncate px-5 py-3 text-krov-ash">
                  {brand.description || "—"}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={
                      brand.is_active
                        ? "text-emerald-400"
                        : "italic text-krov-ash"
                    }
                  >
                    {brand.is_active ? "Activa" : "Inactiva"}
                  </span>
                </td>
                <td className="whitespace-nowrap px-5 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => onEdit(brand)}
                    className="mr-2 rounded-none bg-blue-950 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-800"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(brand)}
                    className="rounded-none bg-red-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
    </div>
  );
}

/** Compact page sequence with ellipses: 1 … 4 5 6 … 20 */
function pageWindow(current: number, total: number): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "gap")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push("gap");
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < total - 1) pages.push("gap");
  pages.push(total);
  return pages;
}

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const baseBtn =
    "flex h-10 min-w-10 items-center justify-center rounded-none border px-3 text-sm transition-all duration-300";
  const idle =
    "border-krov-smoke text-krov-ash hover:border-krov-blood/60 hover:text-krov-rose";
  const disabled = "cursor-not-allowed border-white/5 text-white/20";

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <nav
      aria-label="Paginación de marcas"
      className="flex items-center justify-center gap-2"
    >
      {hasPrev ? (
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          className={`${baseBtn} ${idle}`}
          aria-label="Página anterior"
        >
          <ChevronLeft size={16} />
        </button>
      ) : (
        <span className={`${baseBtn} ${disabled}`} aria-hidden>
          <ChevronLeft size={16} />
        </span>
      )}

      {pageWindow(page, totalPages).map((p, i) =>
        p === "gap" ? (
          <span key={`gap-${i}`} className="px-2 text-white/30">
            …
          </span>
        ) : p === page ? (
          <span
            key={p}
            aria-current="page"
            className={`${baseBtn} border-krov-blood bg-krov-blood font-semibold text-black`}
          >
            {p}
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={`${baseBtn} ${idle}`}
          >
            {p}
          </button>
        )
      )}

      {hasNext ? (
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          className={`${baseBtn} ${idle}`}
          aria-label="Página siguiente"
        >
          <ChevronRight size={16} />
        </button>
      ) : (
        <span className={`${baseBtn} ${disabled}`} aria-hidden>
          <ChevronRight size={16} />
        </span>
      )}
    </nav>
  );
}

/** Minimal escaping for the name interpolated into the SweetAlert HTML. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
