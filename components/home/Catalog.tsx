"use client";

import { useState } from "react";
import ProductFilters from "../product/ProductFilters";
import ProductFilterOrderBy from "../product/ProductFilterOrderBy";
import ProductList from "../product/ProductList";
import Searchbar from "../ui/Searchbar";
import type { ProductOrderBy } from "@/types/productFilter";
import { useProducts } from "@/hooks/useProducts";

export default function CatalogSection() {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [orderBy, setOrderBy] = useState<ProductOrderBy>("price_asc");
  const [query, setQuery] = useState<string>("");

  // Extraemos también isLoading para la UI
  const { data: products = [], isLoading } = useProducts({
    category: selectedCategory,
    orderBy,
    query
  });

  return (
    <section id="catalog" className="py-10 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Catálogo</h2>

        {/* Toolbar: Buscador + Filtros */}
        <div className="flex flex-col md:flex-row md:items-end gap-4 mb-8">
          <div className="flex-1">
            <Searchbar onSearch={setQuery} />
          </div>

          <div className="flex flex-row gap-3">
            <ProductFilters
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
            <ProductFilterOrderBy
              selectedOrder={orderBy}
              onOrderChange={setOrderBy}
            />
          </div>
        </div>

        {/* Pasamos los datos filtrados y el estado de carga a la lista */}
        <ProductList products={products} isLoading={isLoading} />
      </div>
    </section>
  );
}