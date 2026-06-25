"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buildCatalogQuery } from "@/lib/catalogParams";
import type { CatalogPageResult } from "@/types/productFilter";

const serif = "'Cormorant Garamond', 'Garamond', 'Times New Roman', serif";

type Props = Pick<
  CatalogPageResult,
  "currentPage" | "totalPages" | "hasNextPage" | "hasPreviousPage"
>;

/** Build the compact page sequence with ellipses: 1 … 4 5 6 … 20 */
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

export default function CatalogPagination({
  currentPage,
  totalPages,
  hasNextPage,
  hasPreviousPage,
}: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const hrefFor = (page: number) =>
    `${pathname}${buildCatalogQuery(new URLSearchParams(searchParams.toString()), { page })}`;

  const baseBtn =
    "flex h-11 min-w-11 items-center justify-center rounded-lg border px-3 text-sm transition-all duration-300";
  const idle =
    "border-white/10 text-white/70 hover:border-[#c9a96e]/50 hover:text-[#c9a96e]";
  const disabled = "cursor-not-allowed border-white/5 text-white/20";

  const window = pageWindow(currentPage, totalPages);

  return (
    <nav
      aria-label="Paginación del catálogo"
      className="mt-14 flex flex-col items-center gap-4"
    >
      {/* Desktop: full numbered bar */}
      <div className="hidden items-center gap-2 sm:flex" style={{ fontFamily: serif }}>
        {hasPreviousPage ? (
          <Link href={hrefFor(currentPage - 1)} className={`${baseBtn} ${idle}`} aria-label="Página anterior">
            <ChevronLeft size={16} />
          </Link>
        ) : (
          <span className={`${baseBtn} ${disabled}`} aria-hidden>
            <ChevronLeft size={16} />
          </span>
        )}

        {window.map((p, i) =>
          p === "gap" ? (
            <span key={`gap-${i}`} className="px-2 text-white/30">
              …
            </span>
          ) : p === currentPage ? (
            <span
              key={p}
              aria-current="page"
              className={`${baseBtn} border-[#c9a96e] bg-[#c9a96e] font-semibold text-black`}
            >
              {p}
            </span>
          ) : (
            <Link key={p} href={hrefFor(p)} className={`${baseBtn} ${idle}`}>
              {p}
            </Link>
          )
        )}

        {hasNextPage ? (
          <Link href={hrefFor(currentPage + 1)} className={`${baseBtn} ${idle}`} aria-label="Página siguiente">
            <ChevronRight size={16} />
          </Link>
        ) : (
          <span className={`${baseBtn} ${disabled}`} aria-hidden>
            <ChevronRight size={16} />
          </span>
        )}
      </div>

      {/* Mobile: compact prev / indicator / next */}
      <div className="flex w-full items-center justify-between gap-3 sm:hidden" style={{ fontFamily: serif }}>
        {hasPreviousPage ? (
          <Link href={hrefFor(currentPage - 1)} className={`${baseBtn} ${idle} flex-1`}>
            <ChevronLeft size={16} /> <span className="ml-1">Anterior</span>
          </Link>
        ) : (
          <span className={`${baseBtn} ${disabled} flex-1`}>
            <ChevronLeft size={16} /> <span className="ml-1">Anterior</span>
          </span>
        )}

        <span className="shrink-0 text-xs uppercase tracking-[0.15em] text-white/60">
          {currentPage} / {totalPages}
        </span>

        {hasNextPage ? (
          <Link href={hrefFor(currentPage + 1)} className={`${baseBtn} ${idle} flex-1`}>
            <span className="mr-1">Siguiente</span> <ChevronRight size={16} />
          </Link>
        ) : (
          <span className={`${baseBtn} ${disabled} flex-1`}>
            <span className="mr-1">Siguiente</span> <ChevronRight size={16} />
          </span>
        )}
      </div>

      <p className="text-[11px] uppercase tracking-[0.2em] text-white/35" style={{ fontFamily: serif }}>
        Página {currentPage} de {totalPages}
      </p>
    </nav>
  );
}
