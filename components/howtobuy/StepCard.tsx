"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import ImagePlaceholder from "./ImagePlaceholder";
import { cardReveal, fadeUp, serif, stagger } from "./styles";

export type Step = {
  number: number;
  title: string;
  description: string;
  /** Optional secondary note rendered in a refined call-out (e.g. SINPE). */
  note?: string;
  icon: LucideIcon;
  imageSrc?: string;
  imageAlt: string;
};

type StepCardProps = {
  step: Step;
  /** Position within its section — drives the left/right alternation. */
  index: number;
};

/**
 * A large, glassmorphic step card with an alternating image/text layout on
 * desktop and a stacked (image-first) layout on mobile.
 */
export default function StepCard({ step, index }: StepCardProps) {
  const Icon = step.icon;
  const imageRight = index % 2 === 1;

  return (
    <motion.article
      variants={cardReveal}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-90px" }}
      className="group relative overflow-hidden rounded-[1.6rem] border border-white/5 bg-white/[0.025] p-5 backdrop-blur-sm transition-all duration-500 hover:border-[#c9a96e]/25 hover:bg-white/[0.04] hover:shadow-[0_40px_120px_-50px_rgba(201,169,110,0.3)] sm:p-7 lg:p-9"
    >
      {/* Faint oversized ghost number for editorial depth */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-4 -top-10 select-none text-[9rem] leading-none text-white/[0.025] sm:text-[12rem]"
        style={{ fontFamily: serif }}
      >
        {String(step.number).padStart(2, "0")}
      </span>

      <div className="relative grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
        {/* Visual */}
        <motion.div
          variants={fadeUp}
          className={imageRight ? "lg:order-2" : "lg:order-1"}
        >
          <ImagePlaceholder
            number={step.number}
            src={step.imageSrc}
            alt={step.imageAlt}
          />
        </motion.div>

        {/* Copy */}
        <motion.div
          variants={stagger}
          className={`flex flex-col ${imageRight ? "lg:order-1" : "lg:order-2"}`}
        >
          <motion.div
            variants={fadeUp}
            className="mb-5 flex items-center gap-4"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#c9a96e]/40 text-[#c9a96e] transition-all duration-500 group-hover:bg-[#c9a96e] group-hover:text-black">
              <Icon size={20} strokeWidth={1.4} aria-hidden="true" />
            </span>
            <span
              className="text-xs uppercase tracking-[0.35em] text-[#c9a96e]/80"
              style={{ fontFamily: serif }}
            >
              Paso {String(step.number).padStart(2, "0")}
            </span>
          </motion.div>

          <motion.h3
            variants={fadeUp}
            className="mb-4 text-3xl leading-tight text-white md:text-4xl"
            style={{ fontFamily: serif }}
          >
            {step.title}
          </motion.h3>

          <motion.p
            variants={fadeUp}
            className="text-base leading-relaxed text-white/65 md:text-lg"
            style={{ fontFamily: serif }}
          >
            {step.description}
          </motion.p>

          {step.note && (
            <motion.div
              variants={fadeUp}
              className="mt-6 flex gap-3 rounded-xl border border-[#c9a96e]/20 bg-[#c9a96e]/[0.06] px-5 py-4"
            >
              <span
                aria-hidden="true"
                className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c9a96e]"
              />
              <p
                className="text-sm leading-relaxed text-white/70"
                style={{ fontFamily: serif }}
              >
                {step.note}
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.article>
  );
}
