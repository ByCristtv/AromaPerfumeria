"use client";

import { useCallback } from "react";
import Link from "next/link";
import { useCart } from "@/hooks/useCart";
import { useProductSelection } from "@/hooks/useProductSelection";
import type { ProductCardData, ProductDetailData } from "@/types/product";

import AmbientBackground from "./AmbientBackground";
import ProductGallery from "./ProductGallery";
import PurchasePanel from "./PurchasePanel";
import ProductDescription from "./ProductDescription";
import FragranceNotes from "./FragranceNotes";
import RelatedProducts from "./RelatedProducts";
import StickyPurchaseBar from "./StickyPurchaseBar";
import Reveal from "./Reveal";

interface ProductDetailViewProps {
  product: ProductDetailData;
  related: ProductCardData[];
}

const TYPE_LABEL: Record<string, string> = {
  full_size: "Full size",
  decant: "Decant",
};

export default function ProductDetailView({
  product,
  related,
}: ProductDetailViewProps) {
  const { addItem } = useCart();
  const sel = useProductSelection(product);

  const handleAdd = useCallback(() => {
    if (sel.outOfStock) return;
    const v = sel.selectedVariant;
    const img = product.product_images[0]?.url || "/placeholder.png";
    for (let i = 0; i < sel.quantity; i++) {
      addItem({
        variant_id: v.id,
        product_name: product.name,
        product_type: v.product_type,
        size_ml: v.size_ml,
        price: sel.effectivePrice,
        image_url: img,
        stock: v.stock,
      });
    }
  }, [addItem, product, sel]);

  return (
    <>
      <AmbientBackground />

      <main className="relative pt-24 pb-24 sm:pt-28 sm:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav
            aria-label="Migas"
            className="text-[11px] tracking-[0.24em] uppercase text-black/45 mb-8"
          >
            <Link href="/" className="hover:text-black transition-colors">
              Aroma
            </Link>
            <span className="mx-2 text-black/25">/</span>
            <Link
              href="/#catalog"
              className="hover:text-black transition-colors"
            >
              Catálogo
            </Link>
            <span className="mx-2 text-black/25">/</span>
            <span style={{ color: "#c9a96e" }}>{product.name}</span>
          </nav>

          {/* Hero: gallery + purchase */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
            <ProductGallery
              images={product.product_images}
              productName={product.name}
            />
            <PurchasePanel
              product={product}
              selectedVariant={sel.selectedVariant}
              variants={sel.sortedVariants}
              onSelectVariant={sel.selectVariant}
              quantity={sel.quantity}
              onIncrement={sel.increment}
              onDecrement={sel.decrement}
              effectivePrice={sel.effectivePrice}
              hasOffer={sel.hasOffer}
              outOfStock={sel.outOfStock}
              onAddToCart={handleAdd}
            />
          </section>

          {/* Description */}
          {product.description && (
            <Reveal className="mt-28 sm:mt-36">
              <ProductDescription description={product.description} />
            </Reveal>
          )}

          {/* Fragrance notes */}
          <Reveal className="mt-24 sm:mt-32">
            <FragranceNotes
              top={product.notes_top}
              middle={product.notes_middle}
              base={product.notes_base}
            />
          </Reveal>

          {/* Related */}
          {related.length > 0 && (
            <Reveal className="mt-28 sm:mt-36">
              <RelatedProducts products={related} />
            </Reveal>
          )}
        </div>
      </main>

      <StickyPurchaseBar
        productName={product.name}
        variantLabel={`${sel.selectedVariant.size_ml} ml · ${
          TYPE_LABEL[sel.selectedVariant.product_type] ||
          sel.selectedVariant.product_type
        }`}
        price={sel.effectivePrice}
        onAdd={handleAdd}
        disabled={sel.outOfStock}
      />
    </>
  );
}
