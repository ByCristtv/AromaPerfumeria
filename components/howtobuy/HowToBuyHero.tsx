"use client";

import { ChevronDown } from "lucide-react";
import { serif } from "./styles";
import { useReveal } from "@/hooks/useReveal";

/**
 * Editorial opening for the buying-guide journey.
 *
 * Uses the shared reveal rather than Framer's mount animation. Because the
 * reveal is driven by an IntersectionObserver — and falls back to "just show it"
 * when observers are unavailable — the headline can never end up stranded
 * invisible waiting on an animation frame that hasn't come.
 */
export default function HowToBuyHero() {
  const ref = useReveal<HTMLDivElement>();

  return (
    <section
      aria-label="Cómo comprar en Aroma Perfumería"
      className="relative overflow-hidden px-6 pb-10 pt-28 text-center md:pt-36"
    >
      {/* Ambient gold halos */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-[#c9a96e]/10 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#c9a96e]/30 to-transparent"
      />

      <div ref={ref} className="reveal relative mx-auto max-w-3xl">
        <p
          className="reveal reveal-d1 mb-6 text-xs uppercase tracking-[0.4em] text-[#c9a96e] md:text-sm"
          style={{ fontFamily: serif }}
        >
          Guía de compra · Aroma Perfumería
        </p>
        <h1
          className="reveal reveal-d2 text-4xl leading-tight text-white md:text-6xl lg:text-7xl"
          style={{ fontFamily: serif }}
        >
          Comprar nunca fue
          <br />
          <span className="italic text-[#c9a96e]">tan sencillo</span>
        </h1>
        <p
          className="reveal reveal-d3 mx-auto mt-8 max-w-xl text-base leading-relaxed text-white/65 md:text-lg"
          style={{ fontFamily: serif }}
        >
          Te acompañamos paso a paso para que llevar tu próxima fragancia a casa
          sea una experiencia fácil de entender.
        </p>

        <div className="reveal reveal-d4 mt-12 flex items-center justify-center gap-3 text-[#c9a96e]/60">
          <span className="h-px w-10 bg-[#c9a96e]/40" />
          {/* motion-safe: the bounce is decorative and loops forever. */}
          <ChevronDown
            size={18}
            className="motion-safe:animate-bounce"
            aria-hidden="true"
          />
          <span className="h-px w-10 bg-[#c9a96e]/40" />
        </div>
      </div>
    </section>
  );
}
