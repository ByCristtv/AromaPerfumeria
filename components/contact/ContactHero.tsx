"use client";

import { motion } from "framer-motion";
import { MessageCircle, Sparkles } from "lucide-react";
import ImagePlaceholder from "./ImagePlaceholder";
import { fadeUp, serif, stagger } from "./styles";

/** Editorial opening for the contact experience. */
export default function ContactHero() {
  return (
    <section
      aria-label="Ponte en contacto con Aroma Perfumería"
      className="relative overflow-hidden px-5 pb-12 pt-28 sm:px-8 md:pt-36"
    >
      {/* Ambient gold halos */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/4 h-96 w-96 -translate-x-1/2 rounded-full bg-[#c9a96e]/10 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#c9a96e]/30 to-transparent"
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="text-center lg:text-left"
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
              Contacto · Aroma Perfumería
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-4xl leading-tight text-white md:text-6xl lg:text-7xl"
            style={{ fontFamily: serif }}
          >
            Conversemos
            <br />
            <span className="italic text-[#c9a96e]">contigo</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mx-auto mt-8 max-w-xl text-base leading-relaxed text-white/65 md:text-lg lg:mx-0"
            style={{ fontFamily: serif }}
          >
            Estamos aquí para ayudarte a descubrir tu próxima firma olfativa. Ya
            sea que tengas preguntas sobre productos, pedidos, envíos o
            recomendaciones, nuestro equipo está listo para asistirte.
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="mt-10 flex flex-col items-center gap-4 sm:flex-row lg:items-start"
          >
            <a
              href="#contacto-formulario"
              className="inline-flex items-center gap-2 border border-[#c9a96e] bg-[#c9a96e] px-9 py-4 text-sm uppercase tracking-[0.25em] text-black transition-all duration-500 hover:bg-transparent hover:text-[#c9a96e]"
              style={{ fontFamily: serif }}
            >
              <MessageCircle size={16} aria-hidden="true" />
              Escríbenos
            </a>
            <a
              href="#canales"
              className="inline-block border border-[#c9a96e]/40 px-9 py-4 text-sm uppercase tracking-[0.25em] text-[#c9a96e] transition-all duration-500 hover:border-[#c9a96e] hover:bg-[#c9a96e]/10"
              style={{ fontFamily: serif }}
            >
              Ver canales
            </a>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <ImagePlaceholder
            alt="Atención al cliente de lujo o fotografía de perfumes"
            label="Fotografía hero / Atención premium"
            priority
            src="/images/contact/Hero.avif"
          />
        </motion.div>
      </div>
    </section>
  );
}
