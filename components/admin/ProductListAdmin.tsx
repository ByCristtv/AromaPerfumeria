"use client";

import Swal from "sweetalert2";
import { supabase } from "@/lib/supabase/client";
import { useAdminProducts } from "@/hooks/useAdminProducts";
import { ADMIN_PRODUCTS_QUERY_KEY } from "@/features/admin/getProductsAdmin";
import { useQueryClient } from "@tanstack/react-query";

const currency = new Intl.NumberFormat("es-CR", {
  style: "currency",
  currency: "CRC",
  maximumFractionDigits: 0,
});

export default function ProductListAdmin() {
  const { data: variants = [], isLoading: loading } = useAdminProducts();
  const queryClient = useQueryClient();

  const deleteVariant = async (variantId: string, label: string) => {
    const result = await Swal.fire({
      title: "¿Desactivar variante?",
      text: `Se desactivará la variante "${label}". Esta acción no se puede deshacer.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#c9a96e",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Sí, desactivar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    const { error } = await supabase
      .from("product_variants")
      .update({ is_active: false })
      .eq("id", variantId);

    if (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: `No se pudo desactivar la variante: ${error.message}`,
      });
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ADMIN_PRODUCTS_QUERY_KEY });

    Swal.fire({
      icon: "success",
      title: "Variante desactivada",
      text: "La variante ha sido desactivada exitosamente.",
    });
  };

  if (loading) {
    return (
      <p className="text-[#ececec] text-center py-12">
        Cargando variantes...
      </p>
    );
  }

  if (variants.length === 0) {
    return (
      <p className="text-[#ececec] text-center py-12">
        No hay variantes disponibles.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-[#c9a96e]/30 bg-black shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
      <table className="min-w-full text-sm text-left text-[#ececec]">
        <thead className="bg-[#1a1a1a] text-[#c9a96e] uppercase text-xs tracking-wider">
          <tr>
            <th className="px-4 py-3">SKU</th>
            <th className="px-4 py-3">Producto</th>
            <th className="px-4 py-3">Marca</th>
            <th className="px-4 py-3">Tipo</th>
            <th className="px-4 py-3">Tamaño</th>
            <th className="px-4 py-3">Precio</th>
            <th className="px-4 py-3">Stock</th>
            <th className="px-4 py-3">Categorías</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {variants.map((v) => {
            const effectivePrice =
              v.is_on_offer && v.offer_price != null ? v.offer_price : v.price;

            return (
              <tr
                key={v.variant_id}
                className="border-t border-[#c9a96e]/10 hover:bg-[#1a1a1a]/60 transition-colors"
              >
                <td className="px-4 py-3 font-mono text-xs text-[#a5a5a5]">
                  {v.sku}
                </td>
                <td className="px-4 py-3 font-medium">{v.name}</td>
                <td className="px-4 py-3 text-[#a5a5a5]">{v.brand}</td>
                <td className="px-4 py-3 capitalize text-[#a5a5a5]">
                  {v.product_type === "full_size" ? "Full size" : "Decant"}
                </td>
                <td className="px-4 py-3 text-[#a5a5a5]">{v.size_ml} ml</td>
                <td className="px-4 py-3">
                  {v.is_on_offer && v.offer_price != null ? (
                    <div className="flex flex-col">
                      <span className="line-through text-xs text-[#a5a5a5]">
                        {currency.format(v.price)}
                      </span>
                      <span className="text-[#c9a96e] font-semibold">
                        {currency.format(effectivePrice)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[#c9a96e] font-semibold">
                      {currency.format(effectivePrice)}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      v.stock <= 0
                        ? "text-red-400"
                        : v.stock < 5
                        ? "text-yellow-400"
                        : "text-[#ececec]"
                    }
                  >
                    {v.stock}
                  </span>
                </td>
                <td className="px-4 py-3 text-[#a5a5a5]">
                  {v.categories.length > 0
                    ? v.categories.map((c) => c.name).join(", ")
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      v.is_active
                        ? "text-emerald-400"
                        : "text-[#a5a5a5] italic"
                    }
                  >
                    {v.is_active ? "Activa" : "Inactiva"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button
                    onClick={() =>
                      Swal.fire({
                        icon: "info",
                        title: "Editar variante",
                        text: "Funcionalidad de edición en construcción.",
                      })
                    }
                    className="bg-blue-950 hover:bg-blue-800 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors mr-2"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() =>
                      deleteVariant(
                        v.variant_id,
                        `${v.name} · ${v.size_ml}ml · ${v.sku}`
                      )
                    }
                    className="bg-red-900 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
