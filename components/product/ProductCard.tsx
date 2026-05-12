"use client";
import { useCartStore } from "@/store/useCartStore";
import Image from "next/image";
import { ProductCardData } from "@/types/product";

export default function ProductCard({ product }: { product: ProductCardData }) {
  const addToCart = useCartStore((state) => state.addToCart);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden hover:shadow-xl hover:scale-101 transition duration-300 max-w-xs mx-auto w-full">
      
      {/* Imagen */}
      <div className="relative w-full h-48 bg-white flex items-center justify-center">
        <Image
          src={product.product_images[0]?.url || "/placeholder.png"}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-contain"
        />
      </div>

      {/* Contenido */}
      <div className="p-4 flex flex-col gap-2">
        
        {/* Nombre */}
        <h3 className="font-semibold text-lg line-clamp-1">
          {product.name}
        </h3>

        {/* Marca */}
        <p className="text-sm text-gray-500 line-clamp-2">
          {product.brands?.name}
        </p> 
        
        {/* Tamaño */}
        <p className="text-sm text-gray-500">
          {product.featured_variant?.size_ml} ml
        </p>

        {/* Precio */}
        <span className="text-xl font-bold">
          ${product.featured_variant?.price.toFixed(2)}
        </span>
       

        {/* Botón */}
        <button
          onClick={() => addToCart(product)}
          className="mt-2 bg-black text-white py-2 rounded-lg hover:opacity-80 transition"
        >
          Agregar al carrito
        </button> 
      </div>
    </div>
  );
}