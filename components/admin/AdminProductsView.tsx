"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import ProductForm from "./ProductForm";
import VariantForm from "./VariantForm";
import ProductEditForm from "./ProductEditForm";
import ProductListAdmin from "./ProductListAdmin";
import AdminContainer from "./ui/AdminContainer";
import AdminPageHeader from "./ui/AdminPageHeader";
import Pagination from "./ui/Pagination";
import { SEARCH_PARAM, PAGE_PARAM, buildQuery } from "@/lib/pagination";
import type { AdminVariantRow } from "@/types/product";

interface Props {
  rows: AdminVariantRow[];
  initialSearch: string;
  currentPage: number;
  totalPages: number;
  total: number;
  from: number;
  to: number;
}

/**
 * Products admin — a client island fed by the server page (`app/admin/products`).
 * The variants table is server-rendered + paginated (20/page); this component
 * owns the interactive parts only: the URL-driven search box, the create/variant/
 * edit modals, and the row actions. After any mutation it calls `router.refresh()`
 * so the server-rendered page re-fetches the current page.
 */
export default function AdminProductsView({
  rows,
  initialSearch,
  currentPage,
  totalPages,
  total,
  from,
  to,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const spRef = useRef(searchParams);
  useEffect(() => {
    spRef.current = searchParams;
  }, [searchParams]);

  const [search, setSearch] = useState(initialSearch);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<{
    productId: string;
    variantId: string;
  } | null>(null);
  const firstRun = useRef(true);

  const anyModalOpen = createModalOpen || variantModalOpen || editTarget !== null;

  const closeModal = () => {
    setCreateModalOpen(false);
    setVariantModalOpen(false);
    setEditTarget(null);
  };

  // Re-fetch the current server page after a create/edit/toggle.
  const refresh = () => router.refresh();

  const onModalSuccess = () => {
    closeModal();
    refresh();
  };

  // Debounced search → URL (always resets to page 1). Writing `?q=` re-renders the
  // server page with the new filtered/paginated data.
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

  // Body-scroll lock + Escape close while any modal is open.
  useEffect(() => {
    if (!anyModalOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModal();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [anyModalOpen]);

  return (
    <AdminContainer>
      <AdminPageHeader
        eyebrow="Catálogo"
        title="Gestión de Productos"
        description="Administra tu colección de perfumes premium."
        actions={
          <>
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="rounded-lg bg-[#c9a96e] px-5 py-2.5 text-sm font-semibold uppercase tracking-wider text-black transition-colors hover:bg-[#b8a060]"
            >
              + Nuevo Producto
            </button>
            <button
              type="button"
              onClick={() => setVariantModalOpen(true)}
              className="rounded-lg border border-[#c9a96e]/50 bg-transparent px-5 py-2.5 text-sm font-semibold uppercase tracking-wider text-[#c9a96e] transition-colors hover:border-[#c9a96e] hover:bg-[#c9a96e]/10"
            >
              + Nueva Variante
            </button>
          </>
        }
      />

      <div className="mb-6 max-w-md">
        <div className="relative">
          <Search
            size={17}
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#a5a5a5]"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, marca o SKU…"
            aria-label="Buscar productos"
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
      </div>

      <p className="mb-4 text-xs uppercase tracking-[0.2em] text-[#a5a5a5]">
        {total === 0 ? "Sin productos" : `Mostrando ${from}–${to} de ${total}`}
      </p>

      <ProductListAdmin
        rows={rows}
        onEdit={(productId, variantId) => setEditTarget({ productId, variantId })}
        onChanged={refresh}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        label="Paginación de productos"
      />

      {createModalOpen && (
        <ModalOverlay onClose={closeModal} label="Crear nuevo producto">
          <ProductForm onSuccess={onModalSuccess} />
        </ModalOverlay>
      )}

      {variantModalOpen && (
        <ModalOverlay onClose={closeModal} label="Crear nueva variante">
          <VariantForm onSuccess={onModalSuccess} />
        </ModalOverlay>
      )}

      {editTarget && (
        <ModalOverlay onClose={closeModal} label="Editar producto">
          <ProductEditForm
            productId={editTarget.productId}
            variantId={editTarget.variantId}
            onSuccess={onModalSuccess}
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
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl my-8"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Cerrar"
          onClick={onClose}
          className="absolute top-3 left-3 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-black/80 border border-[#c9a96e]/40 text-[#c9a96e] hover:bg-[#c9a96e] hover:text-black transition-colors shadow-lg"
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
