"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const serif = "'Cormorant Garamond', 'Garamond', 'Times New Roman', serif";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } },
};

/** Compact editorial hero that opens the catalog like a boutique entrance. */
export default function CatalogHero() {
  return (
    <section className="relative overflow-hidden px-5 pt-28 pb-12 text-center sm:px-8 md:pt-36">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-[#c9a96e]/10 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#c9a96e]/30 to-transparent"
      />

      <motion.div
        variants={{ show: { transition: { staggerChildren: 0.12 } } }}
        initial="hidden"
        animate="show"
        className="relative mx-auto max-w-2xl"
      >
        <motion.div
            variants={fadeUp}
            className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#c9a96e]/30 bg-[#c9a96e]/6 px-4 py-2"
          >
            <Sparkles size={14} className="text-[#c9a96e]" aria-hidden="true" />
            <span
              className="text-xs uppercase tracking-[0.35em] text-[#c9a96e]"
              style={{ fontFamily: serif }}
            >
              Catalogo · Aroma Perfumería
            </span>
          </motion.div>
        
        
      </motion.div>
    </section>
  );
}
