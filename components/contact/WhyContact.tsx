"use client";

import { motion } from "framer-motion";
import {
  Headset,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import SectionHeading from "./SectionHeading";
import { fadeUp, serif, stagger } from "./styles";

type Feature = { icon: LucideIcon; title: string; desc: string };

const features: Feature[] = [
  {
    icon: Sparkles,
    title: "Asesoría olfativa personalizada",
    desc: "Recibe recomendaciones a la medida de tus gustos, ocasión y estación.",
  },
  {
    icon: Headset,
    title: "Soporte ágil y cercano",
    desc: "Nuestro equipo está disponible para asistirte con rapidez y calidez.",
  },
  {
    icon: PackageCheck,
    title: "Acompañamiento en tu pedido",
    desc: "Te ayudamos con envíos, seguimiento y cualquier detalle de tu compra.",
  },
  {
    icon: ShieldCheck,
    title: "Productos 100% auténticos",
    desc: "Solo ofrecemos fragancias originales, cuidadosamente seleccionadas.",
  },
];

function TrustFeatureCard({ feature }: { feature: Feature }) {
  const Icon = feature.icon;
  return (
    <motion.article
      variants={fadeUp}
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 240, damping: 22 }}
      className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.025] p-8 backdrop-blur-sm transition-colors duration-500 hover:border-[#c9a96e]/30 hover:bg-white/[0.04]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#c9a96e]/0 blur-2xl transition-all duration-700 group-hover:bg-[#c9a96e]/15"
      />
      <span className="relative mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-[#c9a96e]/40 text-[#c9a96e] transition-all duration-500 group-hover:bg-[#c9a96e] group-hover:text-black">
        <Icon size={22} strokeWidth={1.4} aria-hidden="true" />
      </span>
      <h3
        className="relative mb-3 text-xl text-white"
        style={{ fontFamily: serif }}
      >
        {feature.title}
      </h3>
      <p
        className="relative text-sm leading-relaxed text-white/55"
        style={{ fontFamily: serif }}
      >
        {feature.desc}
      </p>
    </motion.article>
  );
}

export default function WhyContact() {
  return (
    <section aria-labelledby="confianza-heading">
      <div id="confianza-heading">
        <SectionHeading
          eyebrow="Por qué escribirnos"
          title="Una atención digna de tu"
          emphasis="fragancia"
          description="Más que responder dudas, te acompañamos en cada paso de tu experiencia con la perfumería de alta gama."
        />
      </div>

      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
      >
        {features.map((f) => (
          <TrustFeatureCard key={f.title} feature={f} />
        ))}
      </motion.div>
    </section>
  );
}
