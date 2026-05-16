"use client";
import { useCart } from "@/hooks/useCart";
import Image from "next/image";
import { ProductCardData } from "@/types/product";

export default function ProductCard({ product }: { product: ProductCardData }) {
  const { addItem } = useCart();

  const variant = product.featured_variant;
  if (!variant) return null;

  const handleAddToCart = () => {
    addItem({
      variant_id: variant.id,
      product_name: product.name,
      product_type: variant.product_type,
      size_ml: variant.size_ml,
      price: variant.is_on_offer && variant.offer_price
        ? variant.offer_price
        : variant.price,
      image_url: product.product_images[0]?.url || "/placeholder.png",
      stock: variant.stock,
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden hover:shadow-xl hover:scale-101 transition duration-300 max-w-xs mx-auto w-full">
      <div className="relative w-full h-48 bg-white flex items-center justify-center">
        <Image
          src={product.product_images[0]?.url || "/placeholder.png"}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-contain"
        />
      </div>

      <div className="p-4 flex flex-col gap-2">
        <h3 className="font-semibold text-lg line-clamp-1">
          {product.name}
        </h3>

        <p className="text-sm text-gray-500 line-clamp-2">
          {product.brands?.name}
        </p>

        <p className="text-sm text-gray-500">
          {variant.size_ml} ml
        </p>

        <span className="text-xl font-bold">
          ${variant.price.toFixed(2)}
        </span>

        <button
          onClick={handleAddToCart}
          disabled={variant.stock <= 0}
          className="mt-2 bg-black text-white py-2 rounded-lg hover:opacity-80 transition disabled:opacity-40"
        >
          {variant.stock > 0 ? "Agregar al carrito" : "Sin stock"}
        </button>
      </div>
    </div>
  );
}
