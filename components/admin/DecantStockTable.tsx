"use client";

import { useMemo } from "react";
import { useDecantStock } from "@/hooks/useDecantStock";

interface DecantStockTableProps {
  searchQuery?: string;
}

/**
 * Read-only table of every decant variant and the shared ml pool it draws
 * from. The pool lives on the parent product, so sibling sizes repeat the
 * same `pool_ml` — the per-row "unidades posibles" is what differs.
 */
export default function DecantStockTable({
  searchQuery = "",
}: DecantStockTableProps) {
  const { data: rows = [], isLoading, isError, error } = useDecantStock();

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.brand.toLowerCase().includes(q) ||
        r.sku.toLowerCase().includes(q)
    );
  }, [rows, searchQuery]);

  if (isLoading) {
    return (
      <div className="rounded-none border border-krov-smoke bg-krov-graphite p-12 text-center text-krov-ash">
        Cargando stock de decants...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-none border border-red-500/30 bg-krov-graphite p-12 text-center text-red-400">
        {error instanceof Error ? error.message : "Error al cargar el stock de decants"}
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="rounded-none border border-krov-smoke bg-krov-graphite p-12 text-center text-krov-ash">
        No hay variantes de decant todavía. Crea una variante con tipo
        &quot;Decant&quot; y luego genera stock con el botón superior.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-none border border-krov-smoke bg-krov-graphite">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-krov-smoke text-krov-rose uppercase text-xs tracking-wider">
            <th className="px-5 py-4 font-bold">Producto</th>
            <th className="px-5 py-4 font-bold">Marca</th>
            <th className="px-5 py-4 font-bold">SKU</th>
            <th className="px-5 py-4 font-bold text-right">Tamaño</th>
            <th className="px-5 py-4 font-bold text-right">Pool disponible</th>
            <th className="px-5 py-4 font-bold text-right">Unidades posibles</th>
            <th className="px-5 py-4 font-bold text-center">Estado</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((r) => {
            const depleted = r.possible_units <= 0;
            return (
              <tr
                key={r.variant_id}
                className="border-b border-krov-smoke/70 text-krov-bone hover:bg-krov-blood/5 transition-colors"
              >
                <td className="px-5 py-4 font-medium">{r.name}</td>
                <td className="px-5 py-4 text-krov-ash">{r.brand}</td>
                <td className="px-5 py-4 font-mono text-xs text-krov-ash">{r.sku}</td>
                <td className="px-5 py-4 text-right">{r.size_ml} ml</td>
                <td className="px-5 py-4 text-right font-bold text-krov-rose">
                  {r.pool_ml} ml
                </td>
                <td
                  className={`px-5 py-4 text-right font-bold ${
                    depleted ? "text-red-400" : "text-krov-bone"
                  }`}
                >
                  {r.possible_units}
                </td>
                <td className="px-5 py-4 text-center">
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
                      !r.is_active
                        ? "bg-krov-ash/15 text-krov-ash"
                        : depleted
                        ? "bg-red-500/15 text-red-400"
                        : "bg-emerald-500/15 text-emerald-400"
                    }`}
                  >
                    {!r.is_active ? "Inactiva" : depleted ? "Agotado" : "Disponible"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
