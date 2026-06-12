"use client";
import { useCart } from "@/hooks/useCart";
import Image from "next/image";
import Link from "next/link";
import { VariantCardData } from "@/types/product";
import { useState, useEffect, useRef } from "react";

export default function ProductCard({ item }: { item: VariantCardData }) {
  const { addItem } = useCart();

  const formatter = new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    maximumFractionDigits: 0,
  });

  const imageUrl = item.imageUrl || "/placeholder.png";
  const effectivePrice =
    item.is_on_offer && item.offer_price ? item.offer_price : item.price;

  // Clicking a specific variant card lands on the detail page with that
  // variant preselected (read from the `variant` search param there).
  const href = `/products/${item.slug}?variant=${item.variantId}`;

  const [showToast, setShowToast] = useState(false);
  const toastTimeoutRef = useRef<number | null>(null);
  const [showGlow, setShowGlow] = useState(false);
  const glowTimeoutRef = useRef<number | null>(null);

  const handleAddToCart = () => {
    addItem({
      variant_id: item.variantId,
      product_name: item.name,
      product_type: item.product_type,
      size_ml: item.size_ml,
      price: effectivePrice,
      image_url: imageUrl,
      stock: item.stock,
    });

    // show toast
    setShowToast(true);
    setShowGlow(true);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = window.setTimeout(() => {
      setShowToast(false);
      toastTimeoutRef.current = null;
    }, 2000);

    if (glowTimeoutRef.current) {
      clearTimeout(glowTimeoutRef.current);
    }
    glowTimeoutRef.current = window.setTimeout(() => {
      setShowGlow(false);
      glowTimeoutRef.current = null;
    }, 800);
  };

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      if (glowTimeoutRef.current) clearTimeout(glowTimeoutRef.current);
    };
  }, []);

  return (
    <div
      className={`relative bg-white rounded-xl overflow-hidden max-w-xs mx-auto w-full transition-all duration-300 border ${
        showGlow
          ? "border-[#c9a96e] ring-4 ring-[#c9a96e]/20 shadow-[0_0_24px_#c9a96e]"
          : "border-gray-200 shadow-md hover:shadow-xl hover:scale-101"
      }`}
    >
      <Link href={href} className="block">
        <div className="relative w-full h-48 bg-white flex items-center justify-center">
          <Image
            src={imageUrl}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-contain"
          />
        </div>

        <div className="px-4 pt-4 flex flex-col gap-2">
          <h3 className="font-semibold text-lg line-clamp-1">{item.name}</h3>

          <p className="text-sm text-gray-500 line-clamp-2">{item.brand}</p>

          <p className="text-sm text-gray-500">{item.size_ml} ml</p>

          <span className="text-xl font-bold">
            {formatter.format(effectivePrice)}
          </span>
        </div>
      </Link>

      <div className="px-4 pb-4 pt-2">
        <button
          onClick={handleAddToCart}
          disabled={item.stock <= 0}
          className="w-full bg-black text-white py-2 rounded-lg hover:opacity-80 transition disabled:opacity-40"
        >
          {item.stock > 0 ? "Agregar al carrito" : "Sin stock"}
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
