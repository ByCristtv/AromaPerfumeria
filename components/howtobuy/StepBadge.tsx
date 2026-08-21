"use client";

import { serif } from "./styles";

type StepBadgeProps = {
  number: number;
  /** Compact rail variant used inside image overlays. */
  size?: "md" | "lg";
  className?: string;
};

/**
 * A numbered, red-rimmed badge used to mark each step of the journey.
 * Two concentric rings give it a premium, jewellery-like finish.
 *
 * Purely presentational now. It used to be a Framer component with its own
 * `whileInView` scale-in — a third viewport observer inside every card, for a
 * decoration already nested in a container that reveals. It rides the parent
 * card's reveal instead.
 */
export default function StepBadge({
  number,
  size = "md",
  className = "",
}: StepBadgeProps) {
  const dims = size === "lg" ? "w-16 h-16 text-2xl" : "w-12 h-12 text-lg";

  return (
    <div
      className={`relative flex items-center justify-center rounded-full ${dims} ${className}`}
      aria-hidden="true"
    >
      {/* Outer halo */}
      <span className="absolute inset-0 rounded-full bg-krov-blood/10 blur-[2px]" />
      {/* Ring */}
      <span className="absolute inset-0 rounded-full border border-krov-blood/50" />
      <span className="absolute inset-[3px] rounded-full border border-krov-smoke" />
      {/* Number */}
      <span
        className="relative z-10 text-krov-rose tabular-nums"
        style={{ fontFamily: serif }}
      >
        {String(number).padStart(2, "0")}
      </span>
    </div>
  );
}
