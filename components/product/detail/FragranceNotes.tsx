"use client";

import { motion } from "framer-motion";

interface FragranceNotesProps {
  top: string | null;
  middle: string | null;
  base: string | null;
}

const TIERS = [
  {
    key: "top" as const,
    label: "Notas de salida",
    sublabel: "Top",
    description:
      "La primera impresión — frescura inicial que se percibe al instante.",
  },
  {
    key: "middle" as const,
    label: "Notas de corazón",
    sublabel: "Heart",
    description: "El alma del perfume, su carácter dominante.",
  },
  {
    key: "base" as const,
    label: "Notas de fondo",
    sublabel: "Base",
    description:
      "La huella final, la profundidad que permanece sobre la piel.",
  },
];

export default function FragranceNotes({ top, middle, base }: FragranceNotesProps) {
  const tiers = [top, middle, base];
  if (tiers.every((t) => !t)) return null;

  return (
    <section className="relative">
      <header className="text-center mb-10">
        <p
          className="text-[11px] tracking-[0.32em] uppercase"
          style={{ color: "#c9a96e" }}
        >
          La pirámide olfativa
        </p>
        <h2
          className="mt-3 text-3xl sm:text-4xl font-light text-black"
          style={{ fontFamily: '"Cormorant Garamond", "Garamond", serif' }}
        >
          Composición de la fragancia
        </h2>
      </header>

      <ol className="grid gap-5 md:grid-cols-3">
        {TIERS.map((tier, i) => {
          const value = tiers[i];
          if (!value) return null;
          return (
            <motion.li
              key={tier.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                duration: 0.7,
                delay: i * 0.12,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="group relative rounded-2xl bg-white p-6 overflow-hidden"
              style={{
                border: "1px solid rgba(0,0,0,0.06)",
                boxShadow: "0 10px 40px -24px rgba(0,0,0,0.15)",
              }}
            >
              {/* Gold accent strip */}
              <span
                aria-hidden
                className="absolute inset-x-6 top-0 h-px"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, #c9a96e, transparent)",
                }}
              />

              {/* Hover ambient */}
              <span
                aria-hidden
                className="pointer-events-none absolute -bottom-20 -right-20 h-40 w-40 rounded-full opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-100"
                style={{
                  background:
                    "radial-gradient(circle, rgba(201,169,110,0.45), transparent 65%)",
                }}
              />

              <div className="flex items-baseline justify-between">
                <h3
                  className="text-xl font-light text-black"
                  style={{
                    fontFamily: '"Cormorant Garamond", "Garamond", serif',
                  }}
                >
                  {tier.label}
                </h3>
                <span
                  className="text-[10px] tracking-[0.28em] uppercase"
                  style={{ color: "#c9a96e" }}
                >
                  {tier.sublabel}
                </span>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-black/55">
                {tier.description}
              </p>

              <div
                className="mt-5 pt-5 text-sm text-black/85 leading-relaxed"
                style={{ borderTop: "1px dashed rgba(0,0,0,0.08)" }}
              >
                {value}
              </div>
            </motion.li>
          );
        })}
      </ol>
    </section>
  );
}
