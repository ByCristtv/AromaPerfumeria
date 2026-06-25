"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ImageOff } from "lucide-react";
import StepBadge from "./StepBadge";
import { serif } from "./styles";

type ImagePlaceholderProps = {
  /** Optional future screenshot / illustration. When omitted the elegant skeleton shows. */
  src?: string;
  alt: string;
  /** Step number rendered as an overlay badge on the visual. */
  number: number;
  /** Hide the numbered badge (e.g. on the closing success visual). */
  showBadge?: boolean;
  label?: string;
  priority?: boolean;
};

/**
 * 16:9 media slot for every step. Renders a real image when `src` is provided,
 * otherwise a refined dashed-border skeleton with a slow gold shimmer.
 * Designed so a future upload drops in without touching the layout.
 */
export default function ImagePlaceholder({
  src,
  alt,
  number,
  showBadge = true,
  label = "Ilustración / Captura de pantalla",
  priority = false,
}: ImagePlaceholderProps) {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 220, damping: 22 }}
      className="group/img relative w-full"
    >
      {/* Soft gold glow that intensifies on hover */}
      <div className="pointer-events-none absolute -inset-1 rounded-[1.4rem] bg-[#c9a96e]/0 blur-2xl transition-all duration-700 group-hover/img:bg-[#c9a96e]/10" />

      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-[#c9a96e]/15 bg-[#0e0e0e] shadow-[0_20px_60px_-30px_rgba(0,0,0,0.9)] transition-all duration-500 group-hover/img:border-[#c9a96e]/40 group-hover/img:shadow-[0_30px_80px_-30px_rgba(201,169,110,0.25)]">
        {/* Step badge overlay */}
        {showBadge && (
          <div className="absolute left-4 top-4 z-20">
            <StepBadge number={number} />
          </div>
        )}

        {src ? (
          <Image
            src={src}
            alt={alt}
            fill
            priority={priority}
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover transition-transform duration-700 group-hover/img:scale-[1.04]"
          />
        ) : (
          <div
            role="img"
            aria-label={`${label}: ${alt}`}
            className="absolute inset-0"
          >
            {/* Dashed elegant frame */}
            <div className="absolute inset-3 rounded-xl border border-dashed border-[#c9a96e]/25" />

            {/* Slow shimmer sweep */}
            <motion.div
              aria-hidden="true"
              initial={{ x: "-120%" }}
              animate={{ x: "120%" }}
              transition={{
                duration: 2.8,
                repeat: Infinity,
                repeatDelay: 1.4,
                ease: "easeInOut",
              }}
              className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-[#c9a96e]/10 to-transparent"
            />

            {/* Centre label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[#c9a96e]/30 text-[#c9a96e]/70 transition-colors duration-500 group-hover/img:text-[#c9a96e]">
                <ImageOff size={20} strokeWidth={1.3} aria-hidden="true" />
              </span>
              <span
                className="text-xs uppercase tracking-[0.3em] text-white/45"
                style={{ fontFamily: serif }}
              >
                {label}
              </span>
            </div>
          </div>
        )}

        {/* Subtle inner vignette for depth */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_60px_-20px_rgba(0,0,0,0.8)]" />
      </div>
    </motion.div>
  );
}
