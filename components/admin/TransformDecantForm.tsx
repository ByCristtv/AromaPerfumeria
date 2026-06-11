"use client";

import { useMemo, useState, type FormEvent } from "react";
import Swal from "sweetalert2";
import Select from "react-select";
import { useQueryClient } from "@tanstack/react-query";
import { transformToDecant } from "@/features/admin/transformToDecant";
import { useAdminProducts } from "@/hooks/useAdminProducts";
import { DECANT_STOCK_QUERY_KEY } from "@/features/admin/getDecantStock";
import { ADMIN_PRODUCTS_QUERY_KEY } from "@/features/admin/getProductsAdmin";
import { PRODUCTS_QUERY_KEY } from "@/hooks/useProducts";

interface TransformDecantFormProps {
  onSuccess?: () => void;
}

type Option = { value: string; label: string };

export default function TransformDecantForm({
  onSuccess,
}: TransformDecantFormProps) {
  const [loading, setLoading] = useState(false);
  const [sourceVariantId, setSourceVariantId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");

  const { data: variants = [] } = useAdminProducts();
  const queryClient = useQueryClient();

  // Only full-size, active variants can be sacrificed into the pool.
  const fullSizeVariants = useMemo(
    () => variants.filter((v) => v.product_type === "full_size" && v.is_active),
    [variants]
  );

  const options: Option[] = useMemo(
    () =>
      fullSizeVariants.map((v) => ({
        value: v.variant_id,
        label: `${v.name} — ${v.brand} · ${v.sku} (${v.size_ml}ml · stock: ${v.stock})`,
      })),
    [fullSizeVariants]
  );

  const selected = fullSizeVariants.find((v) => v.variant_id === sourceVariantId);
  const qty = Number(quantity);
  const mlToAdd =
    selected && qty > 0 ? selected.size_ml * qty : 0;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selected) {
      Swal.fire({
        icon: "warning",
        title: "Variante requerida",
        text: "Selecciona la variante full size a transformar",
      });
      return;
    }
    if (!Number.isInteger(qty) || qty <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Cantidad inválida",
        text: "La cantidad debe ser un número entero mayor a 0",
      });
      return;
    }
    if (qty > selected.stock) {
      Swal.fire({
        icon: "warning",
        title: "Stock insuficiente",
        text: `Solo hay ${selected.stock} unidades de ${selected.sku} disponibles.`,
      });
      return;
    }

    try {
      setLoading(true);

      const result = await transformToDecant({
        source_variant_id: selected.variant_id,
        quantity: qty,
        notes,
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: DECANT_STOCK_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ADMIN_PRODUCTS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY() }),
      ]);

      const newPool = (result as { new_pool_ml?: number } | null)?.new_pool_ml;
      Swal.fire({
        icon: "success",
        title: "¡Pool actualizado!",
        text:
          newPool != null
            ? `Se agregaron ${mlToAdd} ml. Pool disponible: ${newPool} ml.`
            : `Se agregaron ${mlToAdd} ml al pool de decants.`,
      });

      setSourceVariantId("");
      setQuantity("");
      setNotes("");
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
    <div className="max-w-2xl mx-auto bg-black rounded-2xl border border-[#c9a96e]/30 p-8 shadow-2xl">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-[#ececec]">Generar Stock de Decant</h2>
        <p className="text-[#a5a5a5]">
          Transforma botellas full size en mililitros para el pool compartido
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-4">
          <h3 className="text-[#c9a96e] font-bold border-b border-[#c9a96e]/20 pb-2">
            Variante Full Size de Origen
          </h3>
          <Select<Option>
            instanceId="transform-source-variant"
            className="input-field-custom"
            placeholder="Buscar botella full size..."
            options={options}
            value={options.find((o) => o.value === sourceVariantId) ?? null}
            onChange={(opt) => setSourceVariantId(opt?.value ?? "")}
            noOptionsMessage={() => "No hay variantes full size activas"}
          />
        </div>

        <div className="space-y-4 bg-[#1a1a1a]/50 p-6 rounded-xl border border-[#c9a96e]/10">
          <h3 className="text-[#c9a96e] font-bold border-b border-[#c9a96e]/20 pb-2">
            Transformación
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#c9a96e] uppercase">
                Unidades a transformar
              </label>
              <input
                type="number"
                min={1}
                step={1}
                placeholder="2"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="input-field-custom"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#c9a96e] uppercase">
                Mililitros generados
              </label>
              <div className="input-field-custom flex items-center text-[#c9a96e] font-bold">
                {mlToAdd > 0 ? `${mlToAdd} ml` : "—"}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[#c9a96e] uppercase">
              Notas (opcional)
            </label>
            <input
              type="text"
              placeholder="Ej. Sacrificio de 2 testers"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-field-custom"
            />
          </div>

          {selected && (
            <p className="text-xs text-[#a5a5a5]">
              Se descontarán <span className="text-[#ececec] font-bold">{qty > 0 ? qty : 0}</span>{" "}
              unidad(es) de <span className="text-[#ececec] font-bold">{selected.sku}</span>{" "}
              (stock actual: {selected.stock}).
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#c9a96e] text-black font-black py-4 rounded-lg uppercase hover:bg-[#b8a060] transition-colors disabled:opacity-50"
        >
          {loading ? "Transformando..." : "Transformar a Pool de Decants"}
        </button>
      </form>

      <style jsx>{`
        .input-field-custom {
          width: 100%;
          padding: 0.75rem 1rem;
          background-color: #1a1a1a;
          border: 1px solid rgba(201, 169, 110, 0.3);
          border-radius: 0.5rem;
          color: #ececec;
          transition: all 0.2s;
        }
        .input-field-custom:focus {
          border-color: #c9a96e;
          outline: none;
          box-shadow: 0 0 0 1px #c9a96e;
        }
      `}</style>
    </div>
  );
}
