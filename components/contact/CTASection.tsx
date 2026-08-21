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
      className="relative overflow-hidden rounded-[2rem] border border-krov-smoke bg-gradient-to-b from-krov-coal to-krov-void p-7 shadow-[0_60px_140px_-60px_rgba(255,11,85,0.4)] sm:p-12"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 right-1/4 h-72 w-72 translate-x-1/2 rounded-full bg-krov-blood/10 blur-[100px]"
      />

      <div className="relative grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <motion.div variants={fadeUp} className="order-2 lg:order-1">
          <p
            className="mb-4 text-xs uppercase tracking-[0.4em] text-krov-rose"
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
            <span className="italic text-krov-rose">te espera</span>
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
              className="inline-flex items-center justify-center gap-2 border border-krov-blood bg-krov-blood px-9 py-4 text-sm uppercase tracking-[0.25em] text-black transition-all duration-500 hover:bg-transparent hover:text-krov-rose"
            >
              Explorar catálogo
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <a
              href={CONTACT.whatsapp}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 border border-krov-blood/40 px-9 py-4 text-sm uppercase tracking-[0.25em] text-krov-rose transition-all duration-500 hover:border-krov-blood hover:bg-krov-blood/10"
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
