"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, MessageCircle } from "lucide-react";
import ImagePlaceholder from "./ImagePlaceholder";
import { CONTACT } from "./contactData";
import { fadeUp, serif, stagger } from "./styles";

/** Luxury closing call-to-action. */
export default function CTASection() {
  return (
    <motion.section
      variants={stagger}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      aria-labelledby="cta-heading"
      className="relative overflow-hidden rounded-[2rem] border border-[#c9a96e]/25 bg-gradient-to-b from-[#121110] to-[#0a0a0a] p-7 shadow-[0_60px_140px_-60px_rgba(201,169,110,0.4)] sm:p-12"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 right-1/4 h-72 w-72 translate-x-1/2 rounded-full bg-[#c9a96e]/10 blur-[100px]"
      />

      <div className="relative grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <motion.div variants={fadeUp} className="order-2 lg:order-1">
          <p
            className="mb-4 text-xs uppercase tracking-[0.4em] text-[#c9a96e]"
            style={{ fontFamily: serif }}
          >
            Tu próxima firma
          </p>
          <h2
            id="cta-heading"
            className="mb-5 text-3xl leading-tight text-white md:text-5xl"
            style={{ fontFamily: serif }}
          >
            Tu próxima firma olfativa
            <br />
            <span className="italic text-[#c9a96e]">te espera</span>
          </h2>
          <p
            className="mb-9 max-w-md text-base leading-relaxed text-white/65 md:text-lg"
            style={{ fontFamily: serif }}
          >
            Nuestro equipo está listo para ayudarte a encontrar el aroma perfecto.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Link
              href="/products"
              className="inline-flex items-center justify-center gap-2 border border-[#c9a96e] bg-[#c9a96e] px-9 py-4 text-sm uppercase tracking-[0.25em] text-black transition-all duration-500 hover:bg-transparent hover:text-[#c9a96e]"
              style={{ fontFamily: serif }}
            >
              Explorar catálogo
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <a
              href={CONTACT.whatsapp}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 border border-[#c9a96e]/40 px-9 py-4 text-sm uppercase tracking-[0.25em] text-[#c9a96e] transition-all duration-500 hover:border-[#c9a96e] hover:bg-[#c9a96e]/10"
              style={{ fontFamily: serif }}
            >
              <MessageCircle size={16} aria-hidden="true" />
              Contáctanos
            </a>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="order-1 lg:order-2">
          <ImagePlaceholder
            alt="Fotografía lifestyle de perfume de lujo"
            label="Fotografía lifestyle de lujo"
            src="/images/contact/CTA.avif"
          />
        </motion.div>
      </div>
    </motion.section>
  );
}
