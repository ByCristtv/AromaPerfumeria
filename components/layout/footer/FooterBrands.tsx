"use client";

import { motion } from "framer-motion";
import { FEATURED_BRANDS } from "./footerData";

const serif = "'Cormorant Garamond', 'Garamond', 'Times New Roman', serif";

/**
 * Credibility strip of recognized fragrance houses. Rendered as refined
 * monochrome wordmarks (no third-party logo assets), gilding on hover.
 */
export default function FooterBrands() {
  return (
    <section className="bg-[#080808]">
      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-10">
        <p
          className="mb-10 text-center text-[11px] uppercase tracking-[0.35em] text-white/35"
          style={{ fontFamily: serif }}
        >
          Casas de fragancia que admiramos
        </p>

        <motion.ul
          variants={{ show: { transition: { staggerChildren: 0.06 } } }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-40px" }}
          className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 md:gap-x-14"
        >
          {FEATURED_BRANDS.map((brand) => (
            <motion.li
              key={brand}
              variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
              className="cursor-default text-base text-white/40 grayscale transition-all duration-500 hover:text-[#c9a96e] sm:text-lg"
              style={{ fontFamily: serif, letterSpacing: "0.05em" }}
            >
              {brand}
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
