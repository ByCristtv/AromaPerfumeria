"use client";

import { motion } from "framer-motion";
import { fadeUp, serif, stagger } from "./styles";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  emphasis?: string;
  description?: string;
};

/** Centered editorial heading that introduces each phase of the journey. */
export default function SectionHeading({
  eyebrow,
  title,
  emphasis,
  description,
}: SectionHeadingProps) {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      className="mx-auto max-w-2xl text-center"
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
          className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/55 md:text-lg"
          style={{ fontFamily: serif }}
        >
          {description}
        </motion.p>
      )}
    </motion.div>
  );
}
