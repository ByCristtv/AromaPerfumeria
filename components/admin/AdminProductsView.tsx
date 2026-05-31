"use client";

import { useEffect, useState } from "react";
import ProductForm from "./ProductForm";
import VariantForm from "./VariantForm";
import ProductEditForm from "./ProductEditForm";
import ProductListAdmin from "./ProductListAdmin";
import Searchbar from "../ui/Searchbar";

/**
 * Full-screen admin products view. The variants table is the default
 * surface; the creation form lives in a modal triggered by the
 * "Nuevo Producto" button. Body scroll is locked while a modal is
 * open and Escape / backdrop-click both dismiss it.
 */
export default function AdminProductsView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<{
    productId: string;
    variantId: string;
  } | null>(null);

  const anyModalOpen = createModalOpen || variantModalOpen || editTarget !== null;

  useEffect(() => {
    if (!anyModalOpen) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setCreateModalOpen(false);
        setVariantModalOpen(false);
        setEditTarget(null);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [anyModalOpen]);

  const closeModal = () => {
    setCreateModalOpen(false);
    setVariantModalOpen(false);
    setEditTarget(null);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#ececec] tracking-wide">
              Gestión de Productos
            </h1>
            <p className="text-[#a5a5a5] mt-1">
              Administra tu colección de perfumes premium
            </p>
          </div>
          <div className="flex gap-3 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="bg-[#c9a96e] hover:bg-[#b8a060] text-black font-bold px-5 py-3 rounded-lg uppercase text-sm tracking-wider transition-colors shadow-lg"
            >
              + Nuevo Producto
            </button>
            <button
              type="button"
              onClick={() => setVariantModalOpen(true)}
              className="bg-transparent hover:bg-[#c9a96e]/10 text-[#c9a96e] border border-[#c9a96e]/50 hover:border-[#c9a96e] font-bold px-5 py-3 rounded-lg uppercase text-sm tracking-wider transition-colors shadow-lg"
            >
              + Nueva Variante
            </button>
          </div>
        </div>

        <div className="mb-6 max-w-md">
          <Searchbar
            onSearch={setSearchQuery}
            placeholder="Buscar por nombre o marca..."
          />
        </div>

        <ProductListAdmin
          searchQuery={searchQuery}
          onEdit={(productId, variantId) =>
            setEditTarget({ productId, variantId })
          }
        />
      </div>

      {/* Create modal */}
      {createModalOpen && (
        <ModalOverlay onClose={closeModal} label="Crear nuevo producto">
          <ProductForm onSuccess={closeModal} />
        </ModalOverlay>
      )}

      {/* Variant modal */}
      {variantModalOpen && (
        <ModalOverlay onClose={closeModal} label="Crear nueva variante">
          <VariantForm onSuccess={closeModal} />
        </ModalOverlay>
      )}

      {/* Edit modal */}
      {editTarget && (
        <ModalOverlay onClose={closeModal} label="Editar producto">
          <ProductEditForm
            productId={editTarget.productId}
            variantId={editTarget.variantId}
            onSuccess={closeModal}
          />
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
