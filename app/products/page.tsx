import type { Metadata } from "next";
import { getCatalogPage } from "@/features/products/getProducts";
import {
  hasActiveFilters,
  parseCatalogFilters,
  parseCatalogPage,
  type RawSearchParams,
} from "@/lib/catalogParams";
import CatalogHero from "@/components/catalog/CatalogHero";
import CatalogToolbar from "@/components/catalog/CatalogToolbar";
import ProductGrid from "@/components/catalog/ProductGrid";
import CatalogPagination from "@/components/catalog/CatalogPagination";
import CatalogEmptyState from "@/components/catalog/CatalogEmptyState";

const serif = "'Cormorant Garamond', 'Garamond', 'Times New Roman', serif";

export const metadata: Metadata = {
  title: "Catálogo · Aroma Perfumería",
  description:
    "Explora la colección completa de Aroma Perfumería: perfumes nicho, diseñadores de lujo y decants originales. Filtra por categoría, tipo y precio.",
};

interface ProductsPageProps {
  // Next.js 16: searchParams is async.
  searchParams: Promise<RawSearchParams>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const sp = await searchParams;
  const filters = parseCatalogFilters(sp);
  const page = parseCatalogPage(sp);

  const result = await getCatalogPage(page, filters);
  const filtered = hasActiveFilters(filters);

  const from =
    result.totalProducts === 0
      ? 0
      : (result.currentPage - 1) * result.pageSize + 1;
  const to = Math.min(
    result.currentPage * result.pageSize,
    result.totalProducts
  );

  return (
    <main className="relative min-h-screen bg-[#0a0a0a]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0c0b0a] via-[#0a0a0a] to-[#080808]"
      />

      <div className="relative">
        <CatalogHero total={result.totalProducts} />

        <div className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
          <CatalogToolbar filters={filters} />

          {result.products.length === 0 ? (
            <CatalogEmptyState filtered={filtered} />
          ) : (
            <>
              <p
                className="mb-8 mt-10 text-xs uppercase tracking-[0.2em] text-white/40"
                style={{ fontFamily: serif }}
              >
                Mostrando {from}–{to} de {result.totalProducts}
              </p>

              <ProductGrid products={result.products} />

              <CatalogPagination
                currentPage={result.currentPage}
                totalPages={result.totalPages}
                hasNextPage={result.hasNextPage}
                hasPreviousPage={result.hasPreviousPage}
              />
            </>
          )}
        </div>
      </div>
    </main>
  );
}
