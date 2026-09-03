"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Check, Plus } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { ProductCardData, ProductTypes } from "@/types/product";
import { availableUnits } from "@/lib/stock";
import { formatPrice } from "@/lib/format";
import { useCatalogWholesale } from "@/components/catalog/CatalogWholesaleContext";
import { isWholesaleConfigured } from "@/lib/pricing/wholesale";

const serif = "var(--font-krov-display), 'Cormorant Garamond', Georgia, serif";
const LOW_STOCK_THRESHOLD = 5;

const TYPE_LABEL: Record<ProductTypes, string> = {
  full_size: "Botella",
  decant: "Decant",
  set: "Set",
};

/**
 * ── The card ────────────────────────────────────────────────────────────────
 *
 * Rebuilt from a rounded, bordered, shadowed box into a plate: a luminous image
 * niche with the type set beneath it on the page's own ground. There is no
 * container — the photograph and the words are the card.
 *
 * Two deliberate calls:
 *
 * · The niche stays LIGHT. Product photography is shot on white, so a dark
 *   tile would either show a white rectangle or need every asset re-cut. A
 *   linen plate in a black grid also reads as gallery lighting, which is
 *   exactly the register KROV wants.
 *
 * · The add-to-cart control is a small square that only fills with red on
 *   hover, and on touch it is permanently visible. Hiding a primary action
 *   behind hover is a desktop-only affordance and would strand every phone.
 *
 * All commerce behaviour — variant resolution, wholesale gating, stock maths,
 * `addItem` payload — is unchanged from the previous version.
 */

type BadgeTone = "blood" | "outline" | "muted";

function Badge({ label, tone }: { label: string; tone: BadgeTone }) {
  const styles: Record<BadgeTone, string> = {
    blood: "bg-krov-blood text-krov-void",
    outline: "bg-krov-void/80 text-krov-blush backdrop-blur-sm",
    muted: "bg-krov-void/85 text-krov-ash backdrop-blur-sm",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 text-[9px] uppercase tracking-[0.2em] ${styles[tone]}`}
    >
      {label}
    </span>
  );
}

export default function ProductCard({ product }: { product: ProductCardData }) {
  const { addItem } = useCart();
  const { eligible, pricingMap } = useCatalogWholesale();
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

  // Wholesale dual pricing — shown only to approved buyers, and only when the
  // featured variant is fully configured for wholesale. Prices come from the
  // client-side wholesale fetch (see CatalogWholesaleProvider), never the DTO.
  const wholesale = pricingMap[variant.id];
  const showWholesale =
    eligible && !!wholesale && isWholesaleConfigured(wholesale);
  const wholesalePrice = showWholesale ? (wholesale.wholesale_price as number) : null;
  const minWholesaleQty = showWholesale
    ? (wholesale.min_wholesale_quantity as number)
    : null;

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
    <article className="animate-fadeIn group flex h-full flex-col rounded-2xl bg-krov-void/30">
      {/* ── The niche ──────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-t-xl">
        <Link
          href={`/products/${product.slug}`}
          className="relative block aspect-4/5 overflow-hidden bg-linear-to-b from-krov-linen to-krov-linen-deep"
          aria-label={`Ver ${product.name}`}
        >
          {/* Skeleton until the image decodes — same plate, one shade darker,
              so nothing shifts in tone when the photograph lands. */}
          {!imgLoaded && (
            <span
              aria-hidden
              className="absolute inset-0 animate-pulse bg-krov-linen-deep"
            />
          )}
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            onLoad={() => setImgLoaded(true)}
            className={`object-contain p-7 duration-700 ease-krov group-hover:scale-[1.04] transition-all ${
              imgLoaded ? "opacity-100" : "opacity-0"
            }`}
          />

          {/* A red edge lights along the foot of the plate on hover. Cheaper to
              read than a shadow and it belongs to the palette. */}
          <span
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-krov-blood transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100"
          />
        </Link>

        {/* Badges — square, flush to the corner, stacked. */}
        <div className="pointer-events-none absolute left-0 top-0 flex flex-col items-start">
          {variant.is_on_offer && <Badge label="Oferta" tone="blood" />}
          {variant.product_type === "decant" && (
            <Badge label="Decant" tone="outline" />
          )}
          {lowStock && <Badge label="Últimas unidades" tone="muted" />}
          {!inStock && <Badge label="Agotado" tone="muted" />}
        </div>

        {/*
          Add to cart. Anchored to the plate's bottom-right corner as a square
          that fills red on hover/focus. Always visible on touch (`sm:` gates
          only the opacity fade, not the control itself), and it keeps a 44px
          target on phones.
        */}
        <button
          onClick={handleAddToCart}
          disabled={!inStock}
          aria-label={
            inStock ? `Agregar ${product.name} al carrito` : "Sin stock"
          }
          className={`absolute bottom-0 right-0 flex h-11 w-11 items-center justify-center transition-all duration-300 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 ${
            !inStock
              ? "cursor-not-allowed bg-krov-void/70 text-krov-dust"
              : added
                ? "bg-krov-blood text-krov-void sm:opacity-100"
                : "bg-krov-void/90 text-krov-blush hover:bg-krov-blood hover:text-krov-void"
          }`}
        >
          {added ? (
            <Check size={16} aria-hidden />
          ) : (
            <Plus size={16} aria-hidden />
          )}
        </button>
      </div>

      {/* ── The type ───────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col pt-4">
        <p className="text-[9px] uppercase tracking-[0.28em] text-krov-rose">
          {product.brands?.name ?? "KROV"}
        </p>

        <h3
          className="mt-2 text-lg leading-snug text-krov-bone"
          style={{ fontFamily: serif }}
          title={product.name}
        >
          <Link
            href={`/products/${product.slug}`}
            className="line-clamp-1 transition-colors duration-300 hover:text-krov-blush"
          >
            {product.name}
          </Link>
        </h3>

        <p className="mt-1 text-[11px] tracking-[0.06em] text-krov-dust">
          {TYPE_LABEL[variant.product_type]} · {variant.size_ml} ml
        </p>

        {/* Price sits on its own line at the foot of the card so every card in a
            row aligns its price regardless of how long the name wrapped. */}
        <div className="mt-auto flex items-baseline gap-2.5 pt-3">
          {showWholesale ? (
            // Wholesale buyer: retail struck through, wholesale leads in rose.
            <>
              <span className="text-base text-krov-rose">
                {formatPrice(wholesalePrice as number)}
              </span>
              <span className="text-[11px] text-krov-dust line-through">
                {formatPrice(effectivePrice)}
              </span>
            </>
          ) : (
            <>
              <span className="text-base text-krov-bone">
                {formatPrice(effectivePrice)}
              </span>
              {variant.is_on_offer && variant.offer_price && (
                <span className="text-[11px] text-krov-dust line-through">
                  {formatPrice(variant.price)}
                </span>
              )}
            </>
          )}
        </div>

        {/* Minimum wholesale quantity (no savings % — keep the card clean). */}
        {showWholesale && (
          <span className="mt-2 text-[9px] uppercase tracking-[0.2em] text-krov-dust">
            Desde {minWholesaleQty} uds.
          </span>
        )}
      </div>
    </article>
  );
}
