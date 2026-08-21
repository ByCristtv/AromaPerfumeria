"use client";

import { useReveal } from "@/hooks/useReveal";

/**
 * Animated vertical timeline link drawn between consecutive step cards.
 * The red line "draws" itself into view with a travelling dot.
 *
 * One reveal target for both halves; the draw and the dot travel are CSS
 * transitions (see `.connector-line` / `.connector-dot` in globals.css).
 */
export default function StepConnector() {
  const ref = useReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="relative mx-auto flex h-16 w-px items-center justify-center sm:h-20"
    >
      <span className="connector-line absolute inset-0 w-px bg-gradient-to-b from-krov-blood/40 via-krov-blood/20 to-transparent" />
      <span className="connector-dot absolute top-1/2 h-1.5 w-1.5 rounded-full bg-krov-blood shadow-[0_0_12px_2px_rgba(255,11,85,0.5)]" />
    </div>
  );
}
