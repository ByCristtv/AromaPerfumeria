import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getProductsPage } from "@/features/products/getProducts";
import ProductGrid from "@/components/catalog/ProductGrid";

const serif = "var(--font-krov-display), 'Cormorant Garamond', Georgia, serif";

/**
 * Homepage teaser: the latest arrivals (server-fetched). Creates desire and
 * funnels visitors into the full `/products` showroom. Renders nothing when
 * the catalog is empty.
 *
 * The header is left-aligned against a rule with the count on the right, the
 * way a magazine opens a section — a centred "Selección destacada" block over a
 * grid is the single most recognisable e-commerce template shape there is.
 */
export default async function FeaturedCollection() {
  const { items } = await getProductsPage(0, 8);
  if (items.length === 0) return null;

  return (
    <section
      aria-labelledby="recien-llegados"
      className="bg-krov-ink px-5 py-24 sm:px-8 md:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <header className="mb-12 md:mb-16">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="krov-eyebrow">Recién llegados</p>
              <h2
                id="recien-llegados"
                className="mt-5 text-3xl leading-tight text-krov-bone md:text-5xl"
                style={{ fontFamily: serif }}
              >
                Lo último que <span className="italic text-krov-blush">entró</span>
              </h2>
            </div>

            {/* Desktop-only secondary route out. On mobile the same action sits
                below the grid, where the thumb already is. */}
            <Link
              href="/products"
              className="group hidden items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-krov-ash transition-colors duration-300 hover:text-krov-bone sm:inline-flex"
            >
              <span className="krov-underline">Ver la colección</span>
              <ArrowRight
                size={13}
                aria-hidden
                className="transition-transform duration-500 group-hover:translate-x-1"
              />
            </Link>
          </div>

          <div className="krov-rule mt-8 h-px w-full" />
        </header>

        <ProductGrid products={items} />

        <div className="mt-14 flex justify-center sm:hidden">
          <Link href="/products" className="krov-btn-outline w-full justify-center">
            Ver la colección
            <ArrowRight size={14} aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
