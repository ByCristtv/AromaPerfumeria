"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const serif = "'Cormorant Garamond', 'Garamond', 'Times New Roman', serif";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } },
};

/** Cinematic final conversion band rendered just above the main footer. */
export default function PreFooterCTA() {
  return (
    <section className="relative overflow-hidden">
      {/* Fragrance photography background */}
      <div className="absolute inset-0">
        <Image
          src="/hero-image3.jpg"
          alt=""
          fill
          aria-hidden
          sizes="100vw"
          className="object-cover"
        />
        {/* Cinematic dark overlays + readability gradient */}
        <div className="absolute inset-0 bg-black/70" />
        <div className="absolute inset-0 bg-linear-to-t from-[#080808] via-black/55 to-[#080808]/90" />
        <div className="absolute inset-0 bg-linear-to-r from-black/60 via-transparent to-black/40" />
      </div>

      {/* Gold hairline top frame */}
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[#c9a96e]/50 to-transparent" />

      <motion.div
        variants={{ show: { transition: { staggerChildren: 0.13, delayChildren: 0.05 } } }}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        className="relative mx-auto max-w-3xl px-6 py-24 text-center md:py-32"
      >
        <motion.p
          variants={fadeUp}
          className="mb-6 text-xs uppercase tracking-[0.4em] text-[#c9a96e]"
          style={{ fontFamily: serif }}
        >
          El círculo Aroma
        </motion.p>

        <motion.h2
          variants={fadeUp}
          className="text-3xl leading-tight text-white sm:text-4xl md:text-6xl"
          style={{ fontFamily: serif }}
        >
          Encuentra tu próxima
          <br />
          <span className="italic text-[#c9a96e]">firma olfativa</span>
        </motion.h2>

        <motion.p
          variants={fadeUp}
          className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-white/70 md:text-lg"
          style={{ fontFamily: serif }}
        >
          Descubre perfumes originales, fragancias exclusivas y decants premium
          cuidadosamente seleccionados para los amantes de la perfumería en Costa
          Rica.
        </motion.p>

        <motion.div
          variants={fadeUp}
          className="mt-11 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Link
            href="/products"
            className="group inline-flex items-center gap-2 border border-[#c9a96e] bg-[#c9a96e] px-10 py-4 text-sm uppercase tracking-[0.22em] text-black transition-all duration-500 hover:bg-transparent hover:text-[#c9a96e]"
            style={{ fontFamily: serif }}
          >
            Explorar Catálogo
            <ArrowRight
              size={16}
              aria-hidden
              className="transition-transform duration-500 group-hover:translate-x-1"
            />
          </Link>
          <Link
            href="/about"
            className="inline-block border border-white/30 px-10 py-4 text-sm uppercase tracking-[0.22em] text-white transition-all duration-500 hover:border-[#c9a96e] hover:text-[#c9a96e]"
            style={{ fontFamily: serif }}
          >
            Conocer Más
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
