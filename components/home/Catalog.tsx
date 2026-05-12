"use client";

import ProductFilters, { ProductFilterOrderBy } from "../product/ProductFilters";
import ProductList from "../product/ProductList";
import Searchbar from "../ui/Searchbar";

export default function CatalogSection() {
  
  return (
    <section id="catalog" className="py-10 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Catálogo</h2>

        {/* Toolbar: Buscador + Filtros */}
        <div className="flex flex-col md:flex-row md:items-end gap-4 mb-8">
          {/* Buscador */}
          <div className="flex-1">
            <Searchbar onSearch={(query) => console.log(query)} />
          </div>

          {/* Filtros */}
          <div className="flex flex-row gap-3">
            <ProductFilters
              selectedCategory="Hombre"
              onCategoryChange={(category) => console.log(category)}
            />
            <ProductFilterOrderBy
              selectedOrder="price_asc"
              onOrderChange={(order) => console.log(order)}
            />
          </div>
        </div>

        {/* Productos */}
        <ProductList />
      </div>
    </section>
  );
}