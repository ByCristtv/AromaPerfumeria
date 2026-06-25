"use client";

import { motion } from "framer-motion";

/**
 * Animated vertical timeline link drawn between consecutive step cards.
 * The gold line "draws" itself into view with a travelling dot.
 */
export default function StepConnector() {
  return (
    <div
      aria-hidden="true"
      className="relative mx-auto flex h-16 w-px items-center justify-center sm:h-20"
    >
      <motion.span
        initial={{ scaleY: 0 }}
        whileInView={{ scaleY: 1 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        style={{ originY: 0 }}
        className="absolute inset-0 w-px bg-gradient-to-b from-[#c9a96e]/40 via-[#c9a96e]/20 to-transparent"
      />
      <motion.span
        initial={{ y: -10, opacity: 0 }}
        whileInView={{ y: 10, opacity: 1 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.9, delay: 0.2, ease: "easeInOut" }}
        className="absolute top-1/2 h-1.5 w-1.5 rounded-full bg-[#c9a96e] shadow-[0_0_12px_2px_rgba(201,169,110,0.5)]"
      />
    </div>
  );
}
