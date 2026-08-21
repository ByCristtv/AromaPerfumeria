"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ImageOff } from "lucide-react";

type ImagePlaceholderProps = {
  /** Optional future photography. When omitted the luxury skeleton shows. */
  src?: string;
  alt: string;
  label?: string;
  priority?: boolean;
  className?: string;
};

/**
 * 16:9 luxury media slot. Renders real photography when `src` is provided,
 * otherwise a refined dashed-border skeleton with a slow red shimmer.
 * A future upload drops in without changing the layout.
 */
export default function ImagePlaceholder({
  src,
  alt,
  label = "Fotografía / Ilustración de lujo",
  priority = false,
  className = "",
}: ImagePlaceholderProps) {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 220, damping: 22 }}
      className={`group/img relative w-full ${className}`}
    >
      <div className="pointer-events-none absolute -inset-1 rounded-[1.4rem] bg-krov-blood/0 blur-2xl transition-all duration-700 group-hover/img:bg-krov-blood/10" />

      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-krov-smoke/85 bg-krov-ink shadow-[0_20px_60px_-30px_rgba(0,0,0,0.9)] transition-all duration-500 group-hover/img:border-krov-blood/40 group-hover/img:shadow-[0_30px_80px_-30px_rgba(255,11,85,0.25)]">
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
          <div role="img" aria-label={`${label}: ${alt}`} className="absolute inset-0">
            <div className="absolute inset-3 rounded-xl border border-dashed border-krov-smoke" />

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
              className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-krov-blood/10 to-transparent"
            />

            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-krov-blood/30 text-krov-rose/70 transition-colors duration-500 group-hover/img:text-krov-rose">
                <ImageOff size={20} strokeWidth={1.3} aria-hidden="true" />
              </span>
              <span
                className="text-xs uppercase tracking-[0.3em] text-white/45"
              >
                {label}
              </span>
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_60px_-20px_rgba(0,0,0,0.8)]" />
      </div>
    </motion.div>
  );
}
