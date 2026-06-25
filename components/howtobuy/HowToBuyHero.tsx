"use client";

import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { fadeUp, serif, stagger } from "./styles";

/** Editorial opening for the buying-guide journey. */
export default function HowToBuyHero() {
  return (
    <section
      aria-label="Cómo comprar en Aroma Perfumería"
      className="relative overflow-hidden px-6 pb-10 pt-28 text-center md:pt-36"
    >
      {/* Ambient gold halos */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-[#c9a96e]/10 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#c9a96e]/30 to-transparent"
      />

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="relative mx-auto max-w-3xl"
      >
        <motion.p
          variants={fadeUp}
          className="mb-6 text-xs uppercase tracking-[0.4em] text-[#c9a96e] md:text-sm"
          style={{ fontFamily: serif }}
        >
          Guía de compra · Aroma Perfumería
        </motion.p>
        <motion.h1
          variants={fadeUp}
          className="text-4xl leading-tight text-white md:text-6xl lg:text-7xl"
          style={{ fontFamily: serif }}
        >
          Comprar nunca fue
          <br />
          <span className="italic text-[#c9a96e]">tan sencillo</span>
        </motion.h1>
        <motion.p
          variants={fadeUp}
          className="mx-auto mt-8 max-w-xl text-base leading-relaxed text-white/65 md:text-lg"
          style={{ fontFamily: serif }}
        >
          Te acompañamos paso a paso para que llevar tu próxima fragancia a casa
          sea una experiencia facil de entender.
        </motion.p>

        <motion.div
          variants={fadeUp}
          className="mt-12 flex items-center justify-center gap-3 text-[#c9a96e]/60"
        >
          <span className="h-px w-10 bg-[#c9a96e]/40" />
          <ChevronDown size={18} className="animate-bounce" aria-hidden="true" />
          <span className="h-px w-10 bg-[#c9a96e]/40" />
        </motion.div>
      </motion.div>
    </section>
  );
}
