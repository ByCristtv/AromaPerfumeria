"use client";

import { useEffect, useState } from "react";
import ProductForm from "./ProductForm";
import VariantForm from "./VariantForm";
import ProductEditForm from "./ProductEditForm";
import ProductListAdmin from "./ProductListAdmin";
import Searchbar from "../ui/Searchbar";
import AdminContainer from "./ui/AdminContainer";
import AdminPageHeader from "./ui/AdminPageHeader";

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
