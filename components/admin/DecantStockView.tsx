"use client";

import { useEffect, useState } from "react";
import DecantStockTable from "./DecantStockTable";
import TransformDecantForm from "./TransformDecantForm";
import Searchbar from "../ui/Searchbar";

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
    <div className="min-h-screen bg-[#0a0a0a] pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#ececec] tracking-wide">
              Stock para Decants
            </h1>
            <p className="text-[#a5a5a5] mt-1">
              Pool de mililitros compartido por producto para tus decants
            </p>
          </div>
          <button
            type="button"
            onClick={() => setTransformModalOpen(true)}
            className="bg-[#c9a96e] hover:bg-[#b8a060] text-black font-bold px-5 py-3 rounded-lg uppercase text-sm tracking-wider transition-colors shadow-lg self-start sm:self-auto"
          >
            + Generar Stock de Decant
          </button>
        </div>

        <div className="mb-6 max-w-md">
          <Searchbar
            onSearch={setSearchQuery}
            placeholder="Buscar por producto, marca o SKU..."
          />
        </div>

        <DecantStockTable searchQuery={searchQuery} />
      </div>

      {transformModalOpen && (
        <ModalOverlay onClose={closeModal} label="Generar stock de decant">
          <TransformDecantForm onSuccess={closeModal} />
        </ModalOverlay>
      )}
    </div>
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
