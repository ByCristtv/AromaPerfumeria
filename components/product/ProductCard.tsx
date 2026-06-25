"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, Eye, Heart, ShoppingBag } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { ProductCardData, ProductTypes } from "@/types/product";
import { availableUnits } from "@/lib/stock";
import { formatPrice } from "@/lib/format";

const serif = "'Cormorant Garamond', 'Garamond', 'Times New Roman', serif";
const LOW_STOCK_THRESHOLD = 5;

const TYPE_LABEL: Record<ProductTypes, string> = {
  full_size: "Tamaño completo",
  decant: "Decant",
  set: "Set",
};

type BadgeTone = "gold" | "outline" | "muted";

function Badge({ label, tone }: { label: string; tone: BadgeTone }) {
  const styles: Record<BadgeTone, string> = {
    gold: "bg-[#c9a96e] text-black border-transparent",
    outline: "bg-black/50 text-[#c9a96e] border-[#c9a96e]/40 backdrop-blur-sm",
    muted: "bg-black/60 text-white/70 border-white/15 backdrop-blur-sm",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${styles[tone]}`}
      style={{ fontFamily: serif }}
    >
      {label}
    </span>
  );
}

export default function ProductCard({ product }: { product: ProductCardData }) {
  const { addItem } = useCart();
  const variant = product.featured_variant;

  const [imgLoaded, setImgLoaded] = useState(false);
  const [added, setAdded] = useState(false);
  const addedTimeout = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (addedTimeout.current) clearTimeout(addedTimeout.current);
    };
  }, []);

  // A product with no commercial variant can't be sold or priced.
  if (!variant) return null;

  const imageUrl = product.product_images[0]?.url || "/placeholder.png";
  const effectivePrice =
    variant.is_on_offer && variant.offer_price ? variant.offer_price : variant.price;
  const stock = availableUnits(variant, product.decant_stock_ml);
  const inStock = stock > 0;
  const lowStock = inStock && stock <= LOW_STOCK_THRESHOLD;

  const handleAddToCart = () => {
    if (!inStock) return;
    addItem({
      variant_id: variant.id,
      product_name: product.name,
      product_type: variant.product_type,
      size_ml: variant.size_ml,
      price: effectivePrice,
      image_url: imageUrl,
      stock,
    });
    setAdded(true);
    if (addedTimeout.current) clearTimeout(addedTimeout.current);
    addedTimeout.current = window.setTimeout(() => setAdded(false), 1600);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/8 bg-[#101010] transition-all duration-500 hover:border-[#c9a96e]/40 hover:shadow-[0_30px_70px_-35px_rgba(201,169,110,0.4)]"
    >
      {/* ---- Visual niche ---- */}
      <div className="relative">
        <Link
          href={`/products/${product.slug}`}
          className="relative block aspect-4/5 overflow-hidden bg-linear-to-b from-white to-[#f1ece3]"
          aria-label={`Ver ${product.name}`}
        >
          {/* Skeleton shimmer until the image decodes */}
          {!imgLoaded && (
            <span
              aria-hidden
              className="absolute inset-0 animate-pulse bg-linear-to-br from-[#efe9df] to-[#e2dccf]"
            />
          )}
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            onLoad={() => setImgLoaded(true)}
            className={`object-contain p-6 transition-all duration-700 ease-out group-hover:scale-[1.07] ${
              imgLoaded ? "opacity-100" : "opacity-0"
            }`}
          />

          {/* Desktop hover quick-action: View Details */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden translate-y-3 justify-center pb-4 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 sm:flex">
            <span
              className="inline-flex items-center gap-2 rounded-full bg-black/85 px-5 py-2 text-[11px] uppercase tracking-[0.2em] text-[#c9a96e] backdrop-blur-sm"
              style={{ fontFamily: serif }}
            >
              <Eye size={13} aria-hidden /> Ver detalles
            </span>
          </div>
        </Link>

        {/* Badges */}
        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {variant.is_on_offer && <Badge label="Oferta" tone="gold" />}
          {variant.product_type === "decant" && <Badge label="Decant" tone="outline" />}
          {lowStock && <Badge label="Últimas unidades" tone="muted" />}
          {!inStock && <Badge label="Agotado" tone="muted" />}
        </div>

        
      </div>

      {/* ---- Info ---- */}
      <div className="flex flex-1 flex-col gap-1 px-4 pb-4 pt-4">
        <p
          className="text-[10px] uppercase tracking-[0.28em] text-[#c9a96e]/80"
          style={{ fontFamily: serif }}
        >
          {product.brands?.name ?? "Aroma"}
        </p>

        <Link href={`/products/${product.slug}`}>
          <h3
            className="line-clamp-1 text-lg text-white transition-colors duration-300 group-hover:text-[#c9a96e]"
            style={{ fontFamily: serif }}
            title={product.name}
          >
            {product.name}
          </h3>
        </Link>

        <p className="text-xs text-white/45" style={{ fontFamily: serif }}>
          {TYPE_LABEL[variant.product_type]} · {variant.size_ml} ml
        </p>

        {/* Price + stock */}
        <div className="mt-2 flex items-end justify-between gap-2">
          <div className="flex flex-col">
            {variant.is_on_offer && variant.offer_price && (
              <span className="text-xs text-white/35 line-through" style={{ fontFamily: serif }}>
                {formatPrice(variant.price)}
              </span>
            )}
            <span className="text-xl text-white" style={{ fontFamily: serif }}>
              {formatPrice(effectivePrice)}
            </span>
          </div>
          <span
            className={`mb-1 text-[10px] uppercase tracking-[0.15em] ${
              inStock ? "text-emerald-400/70" : "text-white/30"
            }`}
            style={{ fontFamily: serif }}
          >
            {inStock ? (lowStock ? "Pocas unidades" : "Disponible") : "Sin stock"}
          </span>
        </div>

        {/* Add to cart */}
        <button
          onClick={handleAddToCart}
          disabled={!inStock}
          aria-label={inStock ? `Agregar ${product.name} al carrito` : "Sin stock"}
          className={`mt-4 inline-flex items-center justify-center gap-2 border px-4 py-2.5 text-[11px] uppercase tracking-[0.22em] transition-all duration-500 ${
            !inStock
              ? "cursor-not-allowed border-white/10 text-white/30"
              : added
                ? "border-[#c9a96e] bg-[#c9a96e] text-black"
                : "border-[#c9a96e]/50 text-[#c9a96e] hover:bg-[#c9a96e] hover:text-black"
          }`}
          style={{ fontFamily: serif }}
        >
          {added ? (
            <>
              <Check size={14} aria-hidden /> Agregado
            </>
          ) : (
            <>
              <ShoppingBag size={14} aria-hidden />
              {inStock ? "Agregar al carrito" : "Sin stock"}
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
