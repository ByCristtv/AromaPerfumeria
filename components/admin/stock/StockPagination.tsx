"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buildStockQuery } from "@/lib/stockParams";

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

/** URL-driven pagination for the admin stock panel (mirrors the catalog UX). */
export default function StockPagination({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const hrefFor = (page: number) =>
    `${pathname}${buildStockQuery(new URLSearchParams(searchParams.toString()), { page })}`;

  const baseBtn =
    "flex h-10 min-w-10 items-center justify-center rounded-lg border px-3 text-sm transition-all duration-300";
  const idle =
    "border-[#c9a96e]/20 text-[#a5a5a5] hover:border-[#c9a96e]/60 hover:text-[#c9a96e]";
  const disabled = "cursor-not-allowed border-white/5 text-white/20";

  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;
  const window = pageWindow(currentPage, totalPages);

  return (
    <nav
      aria-label="Paginación de movimientos"
      className="mt-8 flex items-center justify-center gap-2"
    >
      {hasPrev ? (
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

      {hasNext ? (
        <Link href={hrefFor(currentPage + 1)} className={`${baseBtn} ${idle}`} aria-label="Página siguiente">
          <ChevronRight size={16} />
        </Link>
      ) : (
        <span className={`${baseBtn} ${disabled}`} aria-hidden>
          <ChevronRight size={16} />
        </span>
      )}
    </nav>
  );
}
