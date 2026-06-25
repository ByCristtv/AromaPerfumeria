"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { fadeUp, serif } from "./styles";

export type ContactChannel = {
  name: string;
  description: string;
  cta: string;
  url: string;
  icon: string;
};

/** Premium channel card with brand icon, copy, and an action button. */
export default function ContactCard({ channel }: { channel: ContactChannel }) {
  return (
    <motion.a
      href={channel.url}
      target="_blank"
      rel="noreferrer"
      variants={fadeUp}
      whileHover={{ y: -8 }}
      transition={{ type: "spring", stiffness: 240, damping: 22 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-white/[0.025] p-8 text-center backdrop-blur-sm transition-colors duration-500 hover:border-[#c9a96e]/35 hover:bg-white/[0.04]"
    >
      {/* Gold glow on hover */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-[#c9a96e]/0 blur-3xl transition-all duration-700 group-hover:bg-[#c9a96e]/15"
      />

      <div className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-[#c9a96e]/30 bg-[#0e0e0e] transition-all duration-500 group-hover:border-[#c9a96e]/60 group-hover:shadow-[0_0_24px_-6px_rgba(201,169,110,0.5)]">
        <Image
          src={channel.icon}
          alt=""
          width={28}
          height={28}
          className="brightness-110 transition-transform duration-500 group-hover:scale-110"
          aria-hidden="true"
        />
      </div>

      <h3
        className="relative mb-3 text-2xl text-white"
        style={{ fontFamily: serif }}
      >
        {channel.name}
      </h3>
      <p
        className="relative mb-7 flex-1 text-sm leading-relaxed text-white/55"
        style={{ fontFamily: serif }}
      >
        {channel.description}
      </p>

      <span
        className="relative mx-auto inline-flex items-center gap-2 border border-[#c9a96e]/40 px-6 py-2.5 text-xs uppercase tracking-[0.2em] text-[#c9a96e] transition-all duration-500 group-hover:bg-[#c9a96e] group-hover:text-black"
        style={{ fontFamily: serif }}
      >
        {channel.cta}
        <ArrowUpRight size={14} aria-hidden="true" />
      </span>
    </motion.a>
  );
}
