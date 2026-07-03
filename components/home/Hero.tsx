"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";

const serif = "'Cormorant Garamond', 'Garamond', 'Times New Roman', serif";

const images = [
  "/hero-image.avif",
  "/hero-image2.avif",
  "/hero-image3.avif",
  "/hero-image4.avif",
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const } },
};

export default function Hero() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(
      () => setCurrent((prev) => (prev + 1) % images.length),
      5000
    );
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative flex h-screen min-h-160 w-full items-center justify-center overflow-hidden">
      {/* Rotating background */}
      <div className="absolute inset-0">
        {images.map((img, index) => (
          <Image
            key={img}
            src={img}
            alt=""
            fill
            priority={index === 0}
            aria-hidden
            className={`absolute inset-0 object-cover transition-all duration-3000 ease-out ${
              index === current ? "scale-105 opacity-100" : "scale-100 opacity-0"
            }`}
          />
        ))}
        {/* Premium gradient overlays */}
        <div className="absolute inset-0 bg-linear-to-b from-black/70 via-black/45 to-black/85" />
        <div className="absolute inset-0 bg-linear-to-r from-black/60 via-transparent to-black/30" />
      </div>

      {/* Top & bottom hairlines for an editorial frame */}
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[#c9a96e]/40 to-transparent" />

      {/* Content */}
      <motion.div
        variants={{ show: { transition: { staggerChildren: 0.14, delayChildren: 0.1 } } }}
        initial="hidden"
        animate="show"
        className="relative z-10 mx-auto max-w-4xl px-6 text-center"
      >
      
        <motion.h1
          variants={fadeUp}
          className="text-4xl leading-[1.1] text-white sm:text-5xl md:text-7xl"
          style={{ fontFamily: serif }}
        >
          Bienvenido a
          <br />
          <span className="italic text-[#c9a96e]">Aroma Perfumería</span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-white/75 md:text-lg"
          style={{ fontFamily: serif }}
        >
          &ldquo;Se necesita un vestido para el cuerpo y un perfume para el alma.&rdquo; — Yves Saint Laurent.
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
            Explorar catalogo
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
            Nuestra historia
          </Link>
        </motion.div>
      </motion.div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 1 }}
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-[#c9a96e]/60"
      >
        <ChevronDown size={22} className="animate-bounce" aria-hidden />
      </motion.div>
    </section>
  );
}
