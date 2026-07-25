/**
 * URL-safe slug from an arbitrary display name.
 *
 * Normalizes accents (Café → cafe), lowercases, and collapses any run of
 * non-alphanumeric characters into single hyphens. Used when creating catalog
 * records (brands, …) whose `slug` column is UNIQUE and NOT NULL.
 */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip combining diacritics
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-") // non-alphanumerics → hyphen
    .replace(/^-+|-+$/g, ""); // trim leading/trailing hyphens
}
