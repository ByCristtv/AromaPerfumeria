"use client";

import { useEffect, useState } from "react";
import DecantStockTable from "./DecantStockTable";
import TransformDecantForm from "./TransformDecantForm";
import Searchbar from "../ui/Searchbar";
import AdminContainer from "./ui/AdminContainer";
import AdminPageHeader from "./ui/AdminPageHeader";

/**
 * Admin → "Stock para Decants" module.
 *
 * The table is the default surface; the "Generar Stock" button opens a modal
 * that transforms full-size bottles into shared pool ml via the
 * `transform_to_decant` RPC. Body scroll locks while the modal is open and
 * Escape / backdrop-click both dismiss it (same UX as AdminProductsView).
 */
export default function DecantStockView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [transformModalOpen, setTransformModalOpen] = useState(false);

  useEffect(() => {
    if (!transformModalOpen) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setTransformModalOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [transformModalOpen]);

  const closeModal = () => setTransformModalOpen(false);

  return (
    <AdminContainer>
      <AdminPageHeader
        eyebrow="Inventario"
        title="Stock para Decants"
        description="Pool de mililitros compartido por producto para tus decants."
        actions={
          <button
            type="button"
            onClick={() => setTransformModalOpen(true)}
            className="rounded-none bg-krov-blood px-5 py-2.5 text-sm font-semibold uppercase tracking-wider text-black transition-colors hover:bg-krov-crimson"
          >
            + Generar Stock de Decant
          </button>
        }
      />

      <div className="mb-6 max-w-md">
        <Searchbar
          onSearch={setSearchQuery}
          placeholder="Buscar por producto, marca o SKU..."
        />
      </div>

      <DecantStockTable searchQuery={searchQuery} />

      {transformModalOpen && (
        <ModalOverlay onClose={closeModal} label="Generar stock de decant">
          <TransformDecantForm onSuccess={closeModal} />
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
        className="relative w-full max-w-2xl my-8"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Cerrar"
          onClick={onClose}
          className="absolute top-3 left-3 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-black/80 border border-krov-blood/40 text-krov-rose hover:bg-krov-blood hover:text-black transition-colors shadow-lg"
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
