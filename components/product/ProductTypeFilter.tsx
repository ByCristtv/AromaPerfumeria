"use client";

import type { ProductTypes } from "@/types/product";
import type { ProductTypeFilterProps } from "@/types/productFilter";

/**
 * Fully controlled product-type dropdown. `product_type` is NOT a category —
 * it's a column on `product_variants` (`full_size` | `decant` | `set`) — so it
 * gets its own control and combines with the category filter.
 */
const TYPE_OPTIONS: { value: ProductTypes; label: string }[] = [
  { value: "full_size", label: "Tamaño completo" },
  { value: "decant", label: "Decants" },
  { value: "set", label: "Sets" },
];

export default function ProductTypeFilter({
  selectedType,
  onTypeChange,
}: ProductTypeFilterProps) {
  return (
    <div className="w-full max-w-sm">
      <label
        htmlFor="product-type-filter"
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        Tipo
      </label>

      <select
        id="product-type-filter"
        value={selectedType ?? ""}
        onChange={(event) =>
          onTypeChange(event.target.value as ProductTypes | "")
        }
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
      >
        <option value="">Todos los tipos</option>
        {TYPE_OPTIONS.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
    </div>
  );
}
