"use client";

import ProductCard from "@/components/product/ProductCard";
import type { ProductListProps } from "@/types/productFilter";



export default function ProductList({ products, isLoading }: ProductListProps) {
  if (isLoading) {
    return <p className="text-center text-gray-500">Buscando fragancias...</p>;
  }

  // Agregamos un estado vacío para cuando el usuario busca algo que no existe
  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No se encontraron productos con esos filtros.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((p) => (
        <ProductCard key={p.variantId} item={p} />
      ))}
    </div>
  );
}