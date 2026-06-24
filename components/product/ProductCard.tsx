"use client";
import { useCart } from "@/hooks/useCart";
import Image from "next/image";
import Link from "next/link";
import { ProductCardData } from "@/types/product";
import { availableUnits } from "@/lib/stock";
import { useState, useEffect, useRef } from "react";

export default function ProductCard({ product }: { product: ProductCardData }) {
  const { addItem } = useCart();

  const variant = product.featured_variant;

  const formatter = new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    maximumFractionDigits: 0,
  });

  const [showToast, setShowToast] = useState(false);
  const toastTimeoutRef = useRef<number | null>(null);
  const [showGlow, setShowGlow] = useState(false);
  const glowTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      if (glowTimeoutRef.current) clearTimeout(glowTimeoutRef.current);
    };
  }, []);

  // A product with no commercial variant can't be sold or priced.
  if (!variant) return null;

  // First image attached to the PARENT product (catalog ignores the rest).
  const imageUrl = product.product_images[0]?.url || "/placeholder.png";
  const effectivePrice =
    variant.is_on_offer && variant.offer_price ? variant.offer_price : variant.price;
  // Decant-aware: derived from the parent ml pool; full_size/set use stock.
  const stock = availableUnits(variant, product.decant_stock_ml);

  const handleAddToCart = () => {
    addItem({
      variant_id: variant.id,
      product_name: product.name,
      product_type: variant.product_type,
      size_ml: variant.size_ml,
      price: effectivePrice,
      image_url: imageUrl,
      stock,
    });

    setShowToast(true);
    setShowGlow(true);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => {
      setShowToast(false);
      toastTimeoutRef.current = null;
    }, 2000);

    if (glowTimeoutRef.current) clearTimeout(glowTimeoutRef.current);
    glowTimeoutRef.current = window.setTimeout(() => {
      setShowGlow(false);
      glowTimeoutRef.current = null;
    }, 800);
  };

  return (
    <div
      className={`relative bg-white rounded-xl overflow-hidden max-w-xs mx-auto w-full transition-all duration-300 border ${
        showGlow
          ? "border-[#c9a96e] ring-4 ring-[#c9a96e]/20 shadow-[0_0_24px_#c9a96e]"
          : "border-gray-200 shadow-md hover:shadow-xl hover:scale-101"
      }`}
    >
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative w-full h-48 bg-white flex items-center justify-center">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-contain"
          />
        </div>

        <div className="px-4 pt-4 flex flex-col gap-2">
          <h3 className="font-semibold text-lg line-clamp-1">{product.name}</h3>

          <p className="text-sm text-gray-500 line-clamp-2">{product.brands?.name}</p>

          <p className="text-sm text-gray-500">{variant.size_ml} ml</p>

          <span className="text-xl font-bold">{formatter.format(effectivePrice)}</span>
        </div>
      </Link>

      <div className="px-4 pb-4 pt-2">
        <button
          onClick={handleAddToCart}
          disabled={stock <= 0}
          className="w-full bg-black text-white py-2 rounded-lg hover:opacity-80 transition disabled:opacity-40"
        >
          {stock > 0 ? "Agregar al carrito" : "Sin stock"}
        </button>
      </div>

      {/* Toast (fixed at bottom center) */}
      <div
        aria-live="polite"
        className={`pointer-events-none fixed left-1/2 bottom-12 z-50 transform -translate-x-1/2 transition-all duration-300 ease-out ${
          showToast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        <div role="status" className="bg-black text-white px-4 py-2 rounded-md shadow-lg text-sm flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 10-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" clipRule="evenodd" />
          </svg>
          <span>Producto agregado</span>
        </div>
      </div>
    </div>
  );
}
