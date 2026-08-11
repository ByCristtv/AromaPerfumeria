/**
 * Storefront gender rule for the catalog category filter.
 *
 * The catalog category dropdown is single-select and carries a category *id*.
 * Three of the seeded categories describe the intended audience — Hombre,
 * Mujer, Unisex — and the store treats Unisex as belonging to both men's and
 * women's selections. So filtering by Hombre (or Mujer) must ALSO surface
 * Unisex products, while Unisex on its own stays strictly Unisex:
 *
 *   Hombre  -> Hombre + Unisex
 *   Mujer   -> Mujer  + Unisex
 *   Unisex  -> Unisex only
 *   any other category (Nicho, Árabe, …) -> itself only
 *
 * This is the pure expansion of a selected id into the id-list the query
 * filters on; resolving the slug->id map is done by the caller so this stays
 * trivially unit-testable (see catalogCategoryFilter.test.ts).
 */

/** Slugs of the three gender categories the "include Unisex" rule applies to. */
export const GENDER_CATEGORY_SLUGS = ["hombre", "mujer", "unisex"] as const;

export type GenderCategorySlug = (typeof GENDER_CATEGORY_SLUGS)[number];

/** Map of gender-category slug -> its id. Any entry may be absent if unseeded. */
export type GenderCategoryIds = Partial<Record<GenderCategorySlug, string>>;

/**
 * Expand a selected category id into the set of category ids the catalog should
 * match. Returns `[selectedId]` for every non-gender category and for Unisex;
 * appends the Unisex id only for Hombre/Mujer, and only when Unisex is seeded.
 */
export function expandCategoryFilter(
  selectedId: string,
  genderIds: GenderCategoryIds
): string[] {
  const { hombre, mujer, unisex } = genderIds;

  const isMenOrWomen = selectedId === hombre || selectedId === mujer;
  if (unisex && isMenOrWomen && selectedId !== unisex) {
    return [selectedId, unisex];
  }

  return [selectedId];
}
