import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getProductsPage } from "@/features/products/getProducts";
import ProductGrid from "@/components/catalog/ProductGrid";

const serif = "'Cormorant Garamond', 'Garamond', 'Times New Roman', serif";

/**
 * Homepage teaser: the latest arrivals (server-fetched). Creates desire and
 * funnels visitors into the full `/products` showroom. Renders nothing when
 * the catalog is empty.
 */
export default async function FeaturedCollection() {
  const { items } = await getProductsPage(0, 8);
  if (items.length === 0) return null;

  return (
    <section className="bg-[#0a0a0a] px-5 py-24 sm:px-8 md:py-32">
      <div className="mx-auto max-w-7xl">
        <header className="mb-16 text-center">
          <p
            className="mb-5 text-xs uppercase tracking-[0.4em] text-[#c9a96e]"
            style={{ fontFamily: serif }}
          >
            Selección destacada
          </p>
          <h2
            className="text-3xl leading-tight text-white md:text-5xl"
            style={{ fontFamily: serif }}
          >
            Recién <span className="italic text-[#c9a96e]">llegados</span>
          </h2>
          <p
            className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/55 md:text-lg"
            style={{ fontFamily: serif }}
          >
            Las incorporaciones más recientes a nuestra colección, listas para
            convertirse en tu próxima firma olfativa.
          </p>
        </header>

        <ProductGrid products={items} />

        <div className="mt-16 flex justify-center">
          <Link
            href="/products"
            className="group inline-flex items-center gap-2 border border-[#c9a96e] px-10 py-4 text-sm uppercase tracking-[0.22em] text-[#c9a96e] transition-all duration-500 hover:bg-[#c9a96e] hover:text-black"
            style={{ fontFamily: serif }}
          >
            Ver todo el catálogo
            <ArrowRight
              size={16}
              aria-hidden
              className="transition-transform duration-500 group-hover:translate-x-1"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
