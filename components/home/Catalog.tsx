"use client";

import { useMemo, useState } from "react";
import ProductFilters from "../product/ProductFilters";
import ProductFilterOrderBy from "../product/ProductFilterOrderBy";
import ProductTypeFilter from "../product/ProductTypeFilter";
import ProductList from "../product/ProductList";
import Searchbar from "../ui/Searchbar";
import type { ProductOrderBy } from "@/types/productFilter";
import type { ProductTypes } from "@/types/product";
import { useProducts } from "@/hooks/useProducts";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

export default function CatalogSection() {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [productType, setProductType] = useState<ProductTypes | "">("");
  const [orderBy, setOrderBy] = useState<ProductOrderBy>("price_asc");
  const [query, setQuery] = useState<string>("");

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useProducts({ category: selectedCategory, productType, orderBy, query });

  // Flatten the paginated pages into a single list for rendering.
  const products = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data]
  );

  const sentinelRef = useInfiniteScroll({
    hasNextPage: !!hasNextPage,
    isFetching: isFetchingNextPage,
    onLoadMore: fetchNextPage,
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
            <ProductTypeFilter
              selectedType={productType}
              onTypeChange={setProductType}
            />
            <ProductFilterOrderBy
              selectedOrder={orderBy}
              onOrderChange={setOrderBy}
            />
          </div>
        </div>

        <ProductList products={products} isLoading={isLoading} />

        {/* Sentinel: triggers the next page as it scrolls into view. */}
        <div ref={sentinelRef} aria-hidden className="h-px" />

        {/* Manual fallback / status — works even without IntersectionObserver. */}
        {hasNextPage && (
          <div className="flex justify-center mt-8">
            <button
              type="button"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="px-6 py-3 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50"
            >
              {isFetchingNextPage ? "Cargando..." : "Cargar más"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
