"use client";

import type {
  ProductFilterOrderByProps,
  ProductOrderBy,
} from "@/types/productFilter";

const ORDER_OPTIONS: { value: ProductOrderBy; label: string }[] = [
  { value: "price_asc", label: "Precio: Menor" },
  { value: "price_desc", label: "Precio: Mayor" },
  { value: "name_asc", label: "Nombre: A-Z" },
  { value: "name_desc", label: "Nombre: Z-A" },
];

/**
 * Fully controlled order-by dropdown. Parent owns `selectedOrder`,
 * which guarantees the rendered value always matches the value used
 * for fetching.
 */
export default function ProductFilterOrderBy({
  selectedOrder,
  onOrderChange,
}: ProductFilterOrderByProps) {
  return (
    <div className="w-full max-w-45">
      <label
        htmlFor="product-order-filter"
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        Ordenar por
      </label>

      <select
        id="product-order-filter"
        value={selectedOrder}
        onChange={(event) =>
          onOrderChange(event.target.value as ProductOrderBy)
        }
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
      >
        {ORDER_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
