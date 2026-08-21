"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Searchbar from "@/components/ui/Searchbar";
import AdminContainer from "@/components/admin/ui/AdminContainer";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import { useAdminBrands } from "@/hooks/useAdminBrands";
import type { BrandRow } from "@/features/brands/brandsAdmin";
import BrandsTable from "./BrandsTable";
import BrandForm from "./BrandForm";

const PAGE_SIZE = 20;

/**
 * Admin → "Administrar Marcas" module.
 *
 * The table is the default surface. Search filters by name/slug in memory and
 * resets pagination; the "Nueva Marca" button and the per-row "Editar" action
 * both open the same modal (create vs. edit decided by whether a brand is
 * passed). Body scroll locks while the modal is open, Escape / backdrop-click
 * dismiss it — same UX as the products and decant-stock views.
 */
export default function BrandsView() {
  const { data: brands = [], isLoading, isError, error } = useAdminBrands();

  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  // `null` = closed. `"new"` = create. A BrandRow = edit that brand.
  const [modal, setModal] = useState<"new" | BrandRow | null>(null);

  const modalOpen = modal !== null;

  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setModal(null);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [modalOpen]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return brands;
    return brands.filter(
      (b) =>
        b.name.toLowerCase().includes(q) || b.slug.toLowerCase().includes(q)
    );
  }, [brands, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  // Clamp when the active page falls off the end of the filtered set.
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  // A new search shrinks the result set — always restart at page 1.
  //
  // Stable identity is REQUIRED: Searchbar's effect depends on `onSearch` and
  // re-fires `onSearch("")` whenever that reference changes. Without useCallback
  // a fresh handler is created every render (e.g. on page change), which would
  // reset the page back to 1 — making pagination impossible to navigate.
  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q);
    setPage(1);
  }, []);

  return (
    <AdminContainer>
      <AdminPageHeader
        eyebrow="Catálogo"
        title="Administrar Marcas"
        description="Crea, edita y elimina las marcas de tu catálogo de perfumes."
        actions={
          <button
            type="button"
            onClick={() => setModal("new")}
            className="rounded-none bg-krov-blood px-5 py-2.5 text-sm font-semibold uppercase tracking-wider text-black transition-colors hover:bg-krov-crimson"
          >
            + Nueva Marca
          </button>
        }
      />

      <div className="mb-6 max-w-md">
        <Searchbar onSearch={handleSearch} placeholder="Buscar por nombre o slug…" />
      </div>

      {isLoading ? (
        <p className="py-12 text-center text-krov-ash">Cargando marcas…</p>
      ) : isError ? (
        <p className="py-12 text-center text-red-400">
          {error instanceof Error ? error.message : "Error al cargar las marcas"}
        </p>
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center text-krov-ash">
          {searchQuery
            ? "No hay marcas que coincidan con tu búsqueda."
            : "No hay marcas todavía. Crea la primera con el botón superior."}
        </p>
      ) : (
        <BrandsTable
          rows={pageRows}
          page={safePage}
          totalPages={totalPages}
          onPageChange={setPage}
          onEdit={(brand) => setModal(brand)}
        />
      )}

      {modalOpen && (
        <ModalOverlay
          onClose={() => setModal(null)}
          label={modal === "new" ? "Crear marca" : "Editar marca"}
        >
          <BrandForm
            brand={modal === "new" ? null : modal}
            onSuccess={() => setModal(null)}
          />
        </ModalOverlay>
      )}
    </AdminContainer>
  );
}

function ModalOverlay({
  onClose,
  label,
  children,
}: {
  onClose: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative my-8 w-full max-w-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Cerrar"
          onClick={onClose}
          className="absolute left-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-krov-blood/40 bg-black/80 text-krov-rose shadow-lg transition-colors hover:bg-krov-blood hover:text-black"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        {children}
      </div>
    </div>
  );
}
