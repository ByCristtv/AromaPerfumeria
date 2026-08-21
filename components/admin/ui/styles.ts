// Shared design tokens for the admin area.
//
// The panel belongs to KROV: same void ground, same Didone headings, same red.
// What differs is density and restraint — an operator works here for an hour at
// a time, so the storefront's editorial air is traded for information density,
// and red is reserved even more tightly than on the storefront (destructive and
// primary actions only, never decoration).
//
// Import these instead of hard-coding values per page.

/** Display serif used for admin headings — same family as the storefront. */
export const adminSerif =
  "var(--font-krov-display), 'Cormorant Garamond', Georgia, serif";

/**
 * The brand red, for the handful of places an inline style is unavoidable
 * (react-select, SweetAlert2). Prefer the `krov-*` Tailwind tokens everywhere
 * a class can be used.
 */
export const ADMIN_ACCENT = "#ff0b55";
