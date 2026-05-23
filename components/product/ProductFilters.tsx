"use client";

import { useCategories } from "@/hooks/useCategories";
import type { ProductFiltersProps } from "@/types/productFilter";

/**
 * Fully controlled category dropdown. The parent owns the value via
 * `selectedCategory` / `onCategoryChange` — no local state mirror,
 * so a parent-side reset (e.g. "clear filters") propagates.
 */
export default function ProductFilters({
  selectedCategory,
  onCategoryChange,
}: ProductFiltersProps) {
  const { data: categories = [] } = useCategories();

  return (
    <div className="w-full max-w-sm">
      <label
        htmlFor="product-category-filter"
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        Categoría
      </label>

      <select
        id="product-category-filter"
        value={selectedCategory ?? ""}
        onChange={(event) => onCategoryChange(event.target.value)}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
      >
        <option value="">Todas las categorías</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}

// Re-export the order-by filter from its own module so existing
// `import { ProductFilterOrderBy } from "./ProductFilters"` paths
// keep working during the refactor. Prefer the new path going forward.
export { default as ProductFilterOrderBy } from "./ProductFilterOrderBy";
