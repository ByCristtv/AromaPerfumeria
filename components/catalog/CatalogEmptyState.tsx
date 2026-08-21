import Link from "next/link";
import { SearchX } from "lucide-react";

const serif = "var(--font-krov-display), 'Cormorant Garamond', Georgia, serif";

/** Luxury empty state shown when no products match the active filters. */
export default function CatalogEmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="animate-fadeIn mx-auto flex max-w-md flex-col items-center px-6 py-20 text-center">
      {/* Illustration placeholder */}
      <div className="relative mb-8 flex aspect-video w-full max-w-xs items-center justify-center overflow-hidden rounded-2xl border border-dashed border-krov-smoke bg-white/[0.02]">
        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-krov-blood/30 text-krov-rose/70">
          <SearchX size={24} strokeWidth={1.3} aria-hidden />
        </span>
      </div>

      <h3 className="text-2xl text-white md:text-3xl" style={{ fontFamily: serif }}>
        No encontramos fragancias
      </h3>
      <p className="mt-4 text-white/55" style={{ fontFamily: serif }}>
        {filtered
          ? "Prueba ajustando tu búsqueda o filtros para descubrir más opciones de nuestra colección."
          : "Pronto sumaremos nuevas fragancias a esta colección. Vuelve muy pronto."}
      </p>

      {filtered && (
        <Link
          href="/products"
          className="mt-8 inline-block border border-krov-blood px-8 py-3 text-xs uppercase tracking-[0.25em] text-krov-rose transition-all duration-500 hover:bg-krov-blood hover:text-black"
        >
          Limpiar filtros
        </Link>
      )}
    </div>
  );
}
