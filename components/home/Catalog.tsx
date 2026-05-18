"use client";

import { useState } from "react";
import ProductFilters from "../product/ProductFilters";
import ProductFilterOrderBy from "../product/ProductFilterOrderBy";
import ProductList from "../product/ProductList";
import Searchbar from "../ui/Searchbar";
import type { ProductOrderBy } from "@/types/productFilter";

/**
 * Homepage catalog section. Holds the locally controlled filter state
 * (category, order-by, search query). The wiring to actually filter
 * the underlying `useProducts()` query is a TODO — current pages just
 * surface the controls.
 */
export default function CatalogSection() {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [orderBy, setOrderBy] = useState<ProductOrderBy>("price_asc");
  const [query, setQuery] = useState("");

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

        {/* TODO: thread `selectedCategory`, `orderBy`, `query` into
            `useProducts()` once the feature query supports them. */}
        <ProductList />
      </div>
    </section>
  );
}
