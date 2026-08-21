// Shared design tokens for the "Cómo Comprar" experience.
// Keeps the premium identity (KROV red on near-black, Didone headings) in one place.
//
// The Framer Motion variants that used to live here (fadeUp / stagger /
// cardReveal) are gone: the journey's reveals are now CSS transitions driven by
// a single shared IntersectionObserver (hooks/useReveal.ts + the `.reveal`
// utilities in globals.css). Note that components/contact/styles.ts is a
// separate file and still uses Framer — this change is scoped to How-to-Buy.

export const serif =
  "var(--font-krov-display), 'Cormorant Garamond', Georgia, serif";
