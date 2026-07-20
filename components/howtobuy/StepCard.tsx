"use client";

import ImagePlaceholder from "./ImagePlaceholder";
import type { ResolvedStep } from "./steps";
import { serif } from "./styles";
import { useReveal } from "@/hooks/useReveal";

type StepCardProps = {
  step: ResolvedStep;
  /** Position within its section — drives the left/right alternation. */
  index: number;
};

/**
 * A large, glassmorphic step card with an alternating image/text layout on
 * desktop and a stacked (image-first) layout on mobile.
 *
 * Previously this mounted seven Framer Motion nodes (article + visual + copy
 * wrapper + icon row + heading + paragraph + note), each with its own viewport
 * observer, and did that twelve times over. Now the whole card is ONE reveal
 * target driven by the page-wide shared observer, and the internal stagger is
 * pure CSS `transition-delay`. Same choreography, ~1% of the runtime cost.
 */
export default function StepCard({ step, index }: StepCardProps) {
  const ref = useReveal<HTMLElement>();
  const Icon = step.icon;
  const imageRight = index % 2 === 1;

  return (
    <article
      ref={ref}
      className="reveal group relative overflow-hidden rounded-[1.6rem] border border-white/5 bg-white/[0.025] p-5 backdrop-blur-sm transition-colors duration-500 hover:border-[#c9a96e]/25 hover:bg-white/[0.04] sm:p-7 lg:p-9"
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
        <div className={imageRight ? "lg:order-2" : "lg:order-1"}>
          <ImagePlaceholder
            number={step.number}
            src={step.imageSrc}
            alt={step.imageAlt}
          />
        </div>

        {/* Copy — children inherit the parent's reveal, offset by CSS delays. */}
        <div
          className={`flex flex-col ${imageRight ? "lg:order-1" : "lg:order-2"}`}
        >
          <div className="reveal reveal-d1 mb-5 flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#c9a96e]/40 text-[#c9a96e] transition-colors duration-500 group-hover:bg-[#c9a96e] group-hover:text-black">
              <Icon size={20} strokeWidth={1.4} aria-hidden="true" />
            </span>
            <span
              className="text-xs uppercase tracking-[0.35em] text-[#c9a96e]/80"
              style={{ fontFamily: serif }}
            >
              Paso {String(step.number).padStart(2, "0")}
            </span>
          </div>

          <h3
            className="reveal reveal-d2 mb-4 text-3xl leading-tight text-white md:text-4xl"
            style={{ fontFamily: serif }}
          >
            {step.title}
          </h3>

          <p
            className="reveal reveal-d3 text-base leading-relaxed text-white/65 md:text-lg"
            style={{ fontFamily: serif }}
          >
            {step.description}
          </p>

          {step.note && (
            <div className="reveal reveal-d4 mt-6 flex gap-3 rounded-xl border border-[#c9a96e]/20 bg-[#c9a96e]/[0.06] px-5 py-4">
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
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
