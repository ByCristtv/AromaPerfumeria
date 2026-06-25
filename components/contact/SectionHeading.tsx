"use client";

import { motion } from "framer-motion";
import { fadeUp, serif, stagger } from "./styles";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  emphasis?: string;
  description?: string;
  align?: "center" | "left";
};

/** Centered editorial heading that introduces each section. */
export default function SectionHeading({
  eyebrow,
  title,
  emphasis,
  description,
  align = "center",
}: SectionHeadingProps) {
  const alignment =
    align === "center" ? "mx-auto text-center" : "text-left";

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      className={`max-w-2xl ${alignment}`}
    >
      <motion.p
        variants={fadeUp}
        className="mb-5 text-xs uppercase tracking-[0.4em] text-[#c9a96e]"
        style={{ fontFamily: serif }}
      >
        {eyebrow}
      </motion.p>
      <motion.h2
        variants={fadeUp}
        className="text-3xl leading-tight text-white md:text-5xl"
        style={{ fontFamily: serif }}
      >
        {title} {emphasis && <span className="italic text-[#c9a96e]">{emphasis}</span>}
      </motion.h2>
      {description && (
        <motion.p
          variants={fadeUp}
          className={`mt-6 max-w-xl text-base leading-relaxed text-white/55 md:text-lg ${
            align === "center" ? "mx-auto" : ""
          }`}
          style={{ fontFamily: serif }}
        >
          {description}
        </motion.p>
      )}
    </motion.div>
  );
}
