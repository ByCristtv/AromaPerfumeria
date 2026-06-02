"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

interface AddToCartButtonProps {
  onAdd: () => void;
  disabled?: boolean;
  label?: string;
  disabledLabel?: string;
}

interface Particle {
  id: number;
  dx: number;
  dy: number;
  size: number;
}

/**
 * Premium CTA. On click:
 *  - subtle scale pulse
 *  - gold shimmer sweep across the button
 *  - 8 floating gold particles burst upward
 *  - momentary "Agregado" confirmation label
 *
 * Particles auto-clean to avoid stale DOM nodes.
 */
export default function AddToCartButton({
  onAdd,
  disabled,
  label = "Agregar al carrito",
  disabledLabel = "Sin stock",
}: AddToCartButtonProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [pulsing, setPulsing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleClick = () => {
    if (disabled) return;
    onAdd();

    setPulsing(true);
    setConfirmed(true);

    const burst: Particle[] = Array.from({ length: 8 }).map((_, i) => ({
      id: Date.now() + i,
      dx: (Math.random() - 0.5) * 120,
      dy: -40 - Math.random() * 80,
      size: 4 + Math.random() * 4,
    }));
    setParticles((p) => [...p, ...burst]);

    window.setTimeout(() => setPulsing(false), 500);
    window.setTimeout(() => setConfirmed(false), 1600);
    window.setTimeout(
      () =>
        setParticles((p) => p.filter((x) => !burst.find((b) => b.id === x.id))),
      1300
    );
  };

  return (
    <div className="relative">
      <motion.button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        animate={pulsing ? { scale: [1, 0.97, 1.02, 1] } : { scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        whileHover={disabled ? undefined : { y: -1 }}
        className="group relative w-full overflow-hidden rounded-full px-8 py-4 text-sm font-semibold tracking-[0.22em] uppercase text-white disabled:cursor-not-allowed disabled:opacity-40"
        style={{
          background:
            "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)",
          boxShadow:
            "0 18px 40px -18px rgba(201,169,110,0.55), 0 0 0 1px rgba(201,169,110,0.25), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        {/* Gold glow on hover */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(circle at 50% 120%, rgba(201,169,110,0.55), transparent 60%)",
          }}
        />

        {/* Shimmer sweep */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-[1400ms] ease-out"
          style={{
            background:
              "linear-gradient(110deg, transparent 30%, rgba(201,169,110,0.35) 50%, transparent 70%)",
          }}
        />

        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={confirmed ? "confirmed" : disabled ? "out" : "default"}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className="relative inline-flex items-center justify-center gap-2"
          >
            {confirmed ? (
              <>
                <CheckIcon /> Agregado
              </>
            ) : disabled ? (
              disabledLabel
            ) : (
              label
            )}
          </motion.span>
        </AnimatePresence>
      </motion.button>

      {/* Particle burst */}
      <div className="pointer-events-none absolute inset-0 overflow-visible">
        <AnimatePresence>
          {particles.map((p) => (
            <motion.span
              key={p.id}
              initial={{ x: 0, y: 0, opacity: 0.9, scale: 1 }}
              animate={{
                x: p.dx,
                y: p.dy,
                opacity: 0,
                scale: 0.4,
              }}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
              className="absolute left-1/2 top-1/2 rounded-full"
              style={{
                width: p.size,
                height: p.size,
                background:
                  "radial-gradient(circle, #f3dfb0 0%, #c9a96e 60%, transparent 100%)",
                boxShadow: "0 0 10px rgba(201,169,110,0.7)",
              }}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      style={{ color: "#c9a96e" }}
    >
      <path
        d="M5 12.5l4.5 4.5L19 7"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
