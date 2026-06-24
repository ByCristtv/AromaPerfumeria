"use client";

import { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import { useQueryClient } from "@tanstack/react-query";
import { PRODUCTS_QUERY_KEY } from "@/hooks/useProducts";
import {
  getProductImages,
  addProductImage,
  removeProductImage,
  type ProductImage,
} from "@/features/admin/productImages";

interface ProductImagesManagerProps {
  productId: string;
}

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Manage the PARENT product's image gallery (front, side, box, lifestyle…).
 * Each add/remove acts immediately and independently of the parent form's
 * "Save". The first image (lowest position) is the catalog/main image.
 */
export default function ProductImagesManager({ productId }: ProductImagesManagerProps) {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const list = await getProductImages(productId);
        if (!cancelled) setImages(list);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "No se pudieron cargar las imágenes.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const invalidateCatalog = () =>
    queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY() });

  const handleAdd = async (file: File | null) => {
    if (!file) return;
    setError("");
    if (!ACCEPTED.includes(file.type)) {
      setError("Formato no válido. Usa JPG, PNG, WEBP o AVIF.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("La imagen supera el límite de 5 MB.");
      return;
    }
    setUploading(true);
    try {
      const created = await addProductImage(productId, file);
      setImages((prev) => [...prev, created]);
      await invalidateCatalog();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir la imagen.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = async (image: ProductImage) => {
    const result = await Swal.fire({
      title: "¿Eliminar imagen?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#c9a96e",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) return;

    setError("");
    try {
      await removeProductImage(image);
      setImages((prev) => prev.filter((i) => i.id !== image.id));
      await invalidateCatalog();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar la imagen.");
    }
  };

  return (
    <div className="space-y-4 bg-[#1a1a1a]/50 p-6 rounded-xl border border-[#c9a96e]/10">
      <div className="flex items-center justify-between border-b border-[#c9a96e]/20 pb-2">
        <h3 className="text-[#c9a96e] font-bold">Imágenes del Producto</h3>
        <span className="text-[11px] text-[#a5a5a5]">
          La primera imagen es la del catálogo
        </span>
      </div>

      {loading ? (
        <p className="text-sm text-[#a5a5a5]">Cargando imágenes…</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {images.map((img, i) => (
            <div
              key={img.id}
              className="relative aspect-square overflow-hidden rounded-lg border border-[#c9a96e]/20 bg-black"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="h-full w-full object-contain" />
              {i === 0 && (
                <span className="absolute left-1 top-1 rounded bg-[#c9a96e] px-1.5 py-0.5 text-[9px] font-bold text-black">
                  Principal
                </span>
              )}
              <button
                type="button"
                onClick={() => handleRemove(img)}
                aria-label="Eliminar imagen"
                className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white/80 transition hover:bg-red-600 hover:text-white"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ))}

          {/* Add tile */}
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[#c9a96e]/40 text-[#c9a96e] transition hover:bg-[#c9a96e]/5">
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              disabled={uploading}
              onChange={(e) => handleAdd(e.target.files?.[0] ?? null)}
              className="hidden"
            />
            {uploading ? (
              <span className="text-[10px]">Subiendo…</span>
            ) : (
              <>
                <span className="text-2xl leading-none">+</span>
                <span className="mt-1 text-[10px]">Agregar</span>
              </>
            )}
          </label>
        </div>
      )}

      <p className="text-[11px] text-[#a5a5a5]">JPG, PNG, WEBP o AVIF · máx. 5 MB.</p>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
