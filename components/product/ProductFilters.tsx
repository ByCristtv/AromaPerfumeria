"use client";

import { useState } from "react";
import { useCategories } from "@/hooks/useCategories";
import type { ProductFiltersProps } from "@/types/productFilter";

/**
 * Category dropdown filter. Controlled by the parent via
 * `selectedCategory` / `onCategoryChange`, but keeps its own
 * mirrored state for snappier UI.
 */
export default function ProductFilters({
  selectedCategory,
  onCategoryChange,
}: ProductFiltersProps) {
  const { data: categories = [] } = useCategories();
  const [category, setCategory] = useState(selectedCategory);

  const handleChange = (next: string) => {
    setCategory(next);
    onCategoryChange(next);
  };

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
        value={category ?? ""}
        onChange={(event) => handleChange(event.target.value)}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
      >
        {categories.map((c) => (
          <option key={c.id} value={c.name}>
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
