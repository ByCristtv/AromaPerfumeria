"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { SearchX } from "lucide-react";

const serif = "'Cormorant Garamond', 'Garamond', 'Times New Roman', serif";

/** Luxury empty state shown when no products match the active filters. */
export default function CatalogEmptyState({ filtered }: { filtered: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto flex max-w-md flex-col items-center px-6 py-20 text-center"
    >
      {/* Illustration placeholder */}
      <div className="relative mb-8 flex aspect-video w-full max-w-xs items-center justify-center overflow-hidden rounded-2xl border border-dashed border-[#c9a96e]/25 bg-white/[0.02]">
        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-[#c9a96e]/30 text-[#c9a96e]/70">
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
          className="mt-8 inline-block border border-[#c9a96e] px-8 py-3 text-xs uppercase tracking-[0.25em] text-[#c9a96e] transition-all duration-500 hover:bg-[#c9a96e] hover:text-black"
          style={{ fontFamily: serif }}
        >
          Limpiar filtros
        </Link>
      )}
    </motion.div>
  );
}
