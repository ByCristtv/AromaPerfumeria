"use client";

import { ProductFiltersProps } from "../../types/productFilter";
import { useState } from "react";
import { useCategories } from "@/hooks/useCategories";

export default function ProductFilters({
	selectedCategory,
	onCategoryChange,
}: ProductFiltersProps) {
    const { data: categories = [] } = useCategories();
    const [category, setCategory] = useState(selectedCategory);

    const handleCategoryChange = (newCategory: string) => {
        setCategory(newCategory);
        onCategoryChange(newCategory);
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
				value={category}
				onChange={(event) => handleCategoryChange(event.target.value)}
				className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
			>
				{categories.map((categoryItem) => (
					<option key={categoryItem.id} value={categoryItem.name}>
						{categoryItem.name}
					</option>
				))}

			</select>
		</div>
	);
}

type OrderByProps = {
  selectedOrder: string;
  onOrderChange: (order: string) => void;
};

export function ProductFilterOrderBy({
  selectedOrder,
  onOrderChange,
}: OrderByProps) {
  const [orderBy, setOrderBy] = useState(selectedOrder);

  const handleOrderByChange = (newOrderBy: string) => {
    setOrderBy(newOrderBy);
    onOrderChange(newOrderBy);
  };

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
        value={orderBy}
        onChange={(event) => handleOrderByChange(event.target.value)}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
      >
        <option value="price_asc">Precio: Menor</option>
        <option value="price_desc">Precio: Mayor</option>
        <option value="name_asc">Nombre: A-Z</option>
        <option value="name_desc">Nombre: Z-A</option>
      </select>
    </div>
  );
}