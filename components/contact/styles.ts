// Shared design tokens for the "Contacto" experience.
// Mirrors the site's premium identity: KROV red on near-black, Didone headings.

export const serif =
  "var(--font-krov-display), 'Cormorant Garamond', Georgia, serif";

export const ACCENT = "#ff4d74";

export const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};

// Card-level reveal: fades up AND orchestrates inner fadeUp children.
export const cardReveal = {
  hidden: { opacity: 0, y: 36 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1] as const,
      when: "beforeChildren" as const,
      staggerChildren: 0.1,
    },
  },
};
