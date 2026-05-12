"use client";

import ProductCard from "@/components/product/ProductCard";
import { useProducts } from "@/hooks/useProducts";

export default function ProductList() {
  const { data: products = [], isLoading } = useProducts();

  if (isLoading) {
    return <p className="text-center text-gray-500">Cargando productos...</p>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}