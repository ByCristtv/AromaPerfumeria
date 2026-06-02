"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { formatPrice } from "@/lib/format";
import type { ProductCardData } from "@/types/product";

interface RelatedProductsProps {
  products: ProductCardData[];
}

export default function RelatedProducts({ products }: RelatedProductsProps) {
  if (products.length === 0) return null;

  return (
    <section>
      <header className="text-center mb-10">
        <p
          className="text-[11px] tracking-[0.32em] uppercase"
          style={{ color: "#c9a96e" }}
        >
          Selección curada
        </p>
        <h2
          className="mt-3 text-3xl sm:text-4xl font-light text-black"
          style={{ fontFamily: '"Cormorant Garamond", "Garamond", serif' }}
        >
          También te puede gustar
        </h2>
      </header>

      <ul className="grid grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-7">
        {products.map((p, i) => (
          <motion.li
            key={p.id}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{
              duration: 0.6,
              delay: i * 0.08,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <RelatedCard product={p} />
          </motion.li>
        ))}
      </ul>
    </section>
  );
}

function RelatedCard({ product }: { product: ProductCardData }) {
  const variant = product.featured_variant;
  const img = product.product_images[0]?.url || "/placeholder.png";
  const price = variant
    ? variant.is_on_offer && variant.offer_price
      ? variant.offer_price
      : variant.price
    : null;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block"
    >
      <div
        className="relative aspect-square overflow-hidden rounded-2xl bg-white transition-shadow duration-500"
        style={{
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 10px 30px -22px rgba(0,0,0,0.25)",
        }}
      >
        {/* Gold halo on hover */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(circle at 50% 110%, rgba(201,169,110,0.35), transparent 60%)",
          }}
        />
        <Image
          src={img}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, 25vw"
          className="object-contain p-5 transition-transform duration-700 ease-out group-hover:scale-105"
          loading="lazy"
        />
      </div>

      <div className="mt-4 text-center">
        <p
          className="text-[10.5px] tracking-[0.28em] uppercase"
          style={{ color: "#c9a96e" }}
        >
          {product.brands?.name}
        </p>
        <h3
          className="mt-1.5 text-base font-light text-black line-clamp-1"
          style={{ fontFamily: '"Cormorant Garamond", "Garamond", serif' }}
        >
          {product.name}
        </h3>
        {price != null && (
          <p className="mt-1.5 text-sm text-black/70 tabular-nums">
            {formatPrice(price)}
          </p>
        )}
      </div>
    </Link>
  );
}
