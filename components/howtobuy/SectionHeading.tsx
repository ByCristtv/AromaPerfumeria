"use client";

import { serif } from "./styles";
import { useReveal } from "@/hooks/useReveal";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  emphasis?: string;
  description?: string;
};

/**
 * Centered editorial heading that introduces each phase of the journey.
 *
 * One reveal target instead of four Framer nodes; the eyebrow/title/description
 * stagger comes from CSS transition delays.
 */
export default function SectionHeading({
  eyebrow,
  title,
  emphasis,
  description,
}: SectionHeadingProps) {
  const ref = useReveal<HTMLDivElement>();

  return (
    <div ref={ref} className="reveal mx-auto max-w-2xl text-center">
      <p
        className="reveal reveal-d1 mb-5 text-xs uppercase tracking-[0.4em] text-[#c9a96e]"
        style={{ fontFamily: serif }}
      >
        {eyebrow}
      </p>
      <h2
        className="reveal reveal-d2 text-3xl leading-tight text-white md:text-5xl"
        style={{ fontFamily: serif }}
      >
        {title}{" "}
        {emphasis && <span className="italic text-[#c9a96e]">{emphasis}</span>}
      </h2>
      {description && (
        <p
          className="reveal reveal-d3 mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/55 md:text-lg"
          style={{ fontFamily: serif }}
        >
          {description}
        </p>
      )}
    </div>
  );
}
