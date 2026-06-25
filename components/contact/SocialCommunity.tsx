"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import SectionHeading from "./SectionHeading";
import { SOCIALS, type Social } from "./contactData";
import { fadeUp, serif, stagger } from "./styles";

function SocialCard({ social }: { social: Social }) {
  return (
    <motion.a
      href={social.url}
      target="_blank"
      rel="noreferrer"
      variants={fadeUp}
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 240, damping: 22 }}
      className="group relative flex items-center gap-5 overflow-hidden rounded-2xl border border-white/5 bg-white/[0.025] p-6 backdrop-blur-sm transition-colors duration-500 hover:border-[#c9a96e]/35 hover:bg-white/[0.04]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-10 -top-10 h-28 w-28 rounded-full bg-[#c9a96e]/0 blur-2xl transition-all duration-700 group-hover:bg-[#c9a96e]/15"
      />
      <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[#c9a96e]/30 bg-[#0e0e0e] transition-all duration-500 group-hover:border-[#c9a96e]/60">
        <Image
          src={social.icon}
          alt=""
          width={26}
          height={26}
          className="brightness-110 transition-transform duration-500 group-hover:scale-110"
          aria-hidden="true"
        />
      </span>

      <div className="relative min-w-0 flex-1">
        <h3 className="text-lg text-white" style={{ fontFamily: serif }}>
          {social.name}
        </h3>
        <p className="truncate text-sm text-white/50" style={{ fontFamily: serif }}>
          {social.handle}
        </p>
      </div>

      <ArrowUpRight
        size={20}
        aria-hidden="true"
        className="relative shrink-0 text-[#c9a96e]/50 transition-all duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#c9a96e]"
      />
    </motion.a>
  );
}

export default function SocialCommunity() {
  return (
    <section
      aria-labelledby="comunidad-heading"
      className="relative overflow-hidden rounded-[2rem] border border-[#c9a96e]/20 bg-gradient-to-b from-[#121110] to-[#0a0a0a] px-6 py-16 sm:px-12 md:py-20"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[#c9a96e]/10 blur-[100px]"
      />

      <div className="relative">
        <SectionHeading
          eyebrow="Comunidad"
          title="Únete a nuestra comunidad"
          emphasis="olfativa"
          description="Mantente conectado y descubre nuevos lanzamientos, ofertas exclusivas, consejos de fragancias y contenido premium."
        />

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="mx-auto mt-14 grid max-w-4xl gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {SOCIALS.map((s) => (
            <SocialCard key={s.key} social={s} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
