"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PackagePlus, Search, X } from "lucide-react";
import { SEARCH_PARAM, PAGE_PARAM, buildQuery } from "@/lib/pagination";
import BulkStockModal from "@/components/admin/stock/BulkStockModal";

/**
 * Client island for the stock panel: a debounced search box (writes `?q=` to the
 * URL, which re-renders the server page) plus the "Registrar entrada" button
 * that opens the bulk-stock modal. On a successful batch we `router.refresh()`
 * so the server-rendered table reflects the new movements immediately.
 */
export default function StockToolbar({
  initialSearch,
}: {
  initialSearch: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const spRef = useRef(searchParams);
  useEffect(() => {
    spRef.current = searchParams;
  }, [searchParams]);

  const [search, setSearch] = useState(initialSearch);
  const [modalOpen, setModalOpen] = useState(false);
  const firstRun = useRef(true);

  // Debounced search → URL (always resets to page 1).
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const handle = setTimeout(() => {
      const current = spRef.current.get(SEARCH_PARAM) ?? "";
      if (search.trim() === current) return;
      const qs = buildQuery(new URLSearchParams(spRef.current.toString()), {
        [SEARCH_PARAM]: search.trim() || undefined,
        [PAGE_PARAM]: undefined,
      });
      router.push(`${pathname}${qs}`, { scroll: false });
    }, 400);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search
          size={17}
          aria-hidden
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#a5a5a5]"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por producto, marca o SKU…"
          aria-label="Buscar movimientos de stock"
          className="w-full rounded-xl border border-[#c9a96e]/30 bg-[#1a1a1a] py-3 pl-11 pr-10 text-sm text-[#ececec] placeholder:text-[#a5a5a5]/60 outline-none transition-colors focus:border-[#c9a96e] focus:ring-1 focus:ring-[#c9a96e]/40"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            aria-label="Limpiar búsqueda"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a5a5a5] hover:text-[#ececec]"
          >
            <X size={15} />
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#c9a96e] px-5 py-3 text-sm font-semibold text-black transition-colors hover:bg-[#b8a060]"
      >
        <PackagePlus size={17} aria-hidden />
        Registrar entrada
      </button>

      <BulkStockModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
