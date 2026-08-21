"use client";

import {
  Headset,
  ShieldCheck,
  Truck,
  Lock,
  type LucideIcon,
} from "lucide-react";

/**
 * The reassurance band, restated as a masthead strip rather than four cards.
 *
 * Four boxed "trust badges" is the most template-looking element in commerce.
 * The same four promises set as small tracked capitals on one continuous rule
 * do the same job in a third of the height and read as the credit line under a
 * magazine masthead — which is the register the rest of the site is in.
 */

const items: { icon: LucideIcon; title: string }[] = [
  { icon: ShieldCheck, title: "100% originales" },
  { icon: Truck, title: "Envío a todo el país" },
  { icon: Lock, title: "Tarjeta o SINPE Móvil" },
  { icon: Headset, title: "Asesoría uno a uno" },
];

export default function TrustIndicators() {
  return (
    <section
      aria-label="Garantías"
      className="border-b border-krov-smoke/70 bg-krov-ink"
    >
      {/*
        `divide-x` rather than a gap-px grid with a background showing through:
        the old approach painted a full-bleed light plane behind the row and let
        it leak between cells, which produced a visible seam at the section
        edges on any width that did not divide evenly.
      */}
      <ul className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-y divide-krov-smoke/70 sm:divide-y-0 lg:grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li
              key={item.title}
              className="group flex items-center gap-3 px-5 py-6 sm:px-7"
            >
              <Icon
                size={17}
                strokeWidth={1.3}
                aria-hidden
                className="shrink-0 text-krov-rose transition-colors duration-500 group-hover:text-krov-blood"
              />
              <span className="text-[10px] uppercase leading-tight tracking-[0.2em] text-krov-ash transition-colors duration-500 group-hover:text-krov-bone sm:tracking-[0.24em]">
                {item.title}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
