"use client";

import { useState, type FormEvent } from "react";
import Swal from "sweetalert2";
import { useQueryClient } from "@tanstack/react-query";
import {
  createBrand,
  updateBrand,
  ADMIN_BRANDS_QUERY_KEY,
  type BrandRow,
} from "@/features/brands/brandsAdmin";
import { BRANDS_QUERY_KEY } from "@/hooks/useBrands";
import { slugify } from "@/lib/slug";

interface BrandFormProps {
  /** Brand being edited, or `null` to create a new one. */
  brand?: BrandRow | null;
  /** Called after a successful create/update + cache invalidation. */
  onSuccess?: () => void;
}

/**
 * Create / edit form for a brand, rendered inside the BrandsView modal.
 *
 * The slug field auto-fills from the name until the admin edits it manually;
 * from that point it's left alone so a deliberate slug is never overwritten.
 */
export default function BrandForm({ brand, onSuccess }: BrandFormProps = {}) {
  const isEdit = !!brand;
  const queryClient = useQueryClient();

  const [name, setName] = useState(brand?.name ?? "");
  const [slug, setSlug] = useState(brand?.slug ?? "");
  const [description, setDescription] = useState(brand?.description ?? "");
  const [logoUrl, setLogoUrl] = useState(brand?.logo_url ?? "");
  const [isActive, setIsActive] = useState(brand?.is_active ?? true);
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [loading, setLoading] = useState(false);

  const handleNameChange = (value: string) => {
    setName(value);
    // Keep the slug mirroring the name until the admin overrides it.
    if (!slugTouched) setSlug(slugify(value));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name.trim()) {
      Swal.fire({ icon: "warning", title: "El nombre es obligatorio" });
      return;
    }

    try {
      setLoading(true);
      const payload = {
        name,
        slug: slug.trim() || undefined,
        description,
        logo_url: logoUrl,
        is_active: isActive,
      };

      if (isEdit && brand) {
        await updateBrand(brand.id, payload);
      } else {
        await createBrand(payload);
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ADMIN_BRANDS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: BRANDS_QUERY_KEY }),
      ]);

      Swal.fire({
        icon: "success",
        title: isEdit ? "Marca actualizada" : "Marca creada",
        timer: 1600,
        showConfirmButton: false,
      });
      onSuccess?.();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err instanceof Error ? err.message : "Error desconocido",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-[#c9a96e]/30 bg-black p-8 shadow-2xl">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-[#ececec]">
          {isEdit ? "Editar Marca" : "Nueva Marca"}
        </h2>
        <p className="text-[#a5a5a5]">
          {isEdit
            ? "Actualiza los datos de la marca."
            : "Agrega una marca al catálogo."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-[#c9a96e]">
              Nombre
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="brand-input"
              placeholder="Chanel"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-[#c9a96e]">
              Slug
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              className="brand-input font-mono"
              placeholder="chanel"
            />
            <p className="text-[11px] text-[#a5a5a5]">
              Se genera del nombre. Debe ser único.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-[#c9a96e]">
            Logo (URL)
          </label>
          <input
            type="url"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            className="brand-input"
            placeholder="https://…"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-[#c9a96e]">
            Descripción
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="brand-input w-full resize-none"
            placeholder="Breve descripción de la marca (opcional)…"
          />
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-[#ececec]">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="accent-[#c9a96e]"
          />
          Marca activa (visible en la tienda)
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#c9a96e] py-4 font-black uppercase text-black transition-colors hover:bg-[#b8a060] disabled:opacity-50"
        >
          {loading
            ? "Guardando…"
            : isEdit
            ? "Guardar cambios"
            : "Crear marca"}
        </button>
      </form>

      <style jsx>{`
        .brand-input {
          width: 100%;
          padding: 0.75rem 1rem;
          background-color: #1a1a1a;
          border: 1px solid rgba(201, 169, 110, 0.3);
          border-radius: 0.5rem;
          color: #ececec;
          transition: all 0.2s;
        }
        .brand-input:focus {
          border-color: #c9a96e;
          outline: none;
          box-shadow: 0 0 0 1px #c9a96e;
        }
      `}</style>
    </div>
  );
}
