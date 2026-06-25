"use client";

import { motion } from "framer-motion";
import { serif } from "./styles";

type StepBadgeProps = {
  number: number;
  /** Compact rail variant used inside image overlays. */
  size?: "md" | "lg";
  className?: string;
};

/**
 * A numbered, gold-rimmed badge used to mark each step of the journey.
 * Two concentric rings give it a premium, jewellery-like finish.
 */
export default function StepBadge({
  number,
  size = "md",
  className = "",
}: StepBadgeProps) {
  const dims = size === "lg" ? "w-16 h-16 text-2xl" : "w-12 h-12 text-lg";

  return (
    <motion.div
      initial={{ scale: 0.6, opacity: 0 }}
      whileInView={{ scale: 1, opacity: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className={`relative flex items-center justify-center rounded-full ${dims} ${className}`}
      aria-hidden="true"
    >
      {/* Outer halo */}
      <span className="absolute inset-0 rounded-full bg-[#c9a96e]/10 blur-[2px]" />
      {/* Ring */}
      <span className="absolute inset-0 rounded-full border border-[#c9a96e]/50" />
      <span className="absolute inset-[3px] rounded-full border border-[#c9a96e]/20" />
      {/* Number */}
      <span
        className="relative z-10 text-[#c9a96e] tabular-nums"
        style={{ fontFamily: serif }}
      >
        {String(number).padStart(2, "0")}
      </span>
    </motion.div>
  );
}
