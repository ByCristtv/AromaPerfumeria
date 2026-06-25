// Shared design tokens for the "Cómo Comprar" experience.
// Keeps the premium identity (gold on charcoal, Cormorant serif) in one place.

export const serif =
  "'Cormorant Garamond', 'Garamond', 'Times New Roman', serif";

export const GOLD = "#c9a96e";

// Framer Motion fade-up used across every block.
export const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  },
};

// Soft stagger for grouped children (labels, headings, copy).
export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};

// Card-level reveal: fades the card up AND orchestrates its inner fadeUp children.
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
