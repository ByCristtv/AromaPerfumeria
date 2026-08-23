/**
 * Format a numeric value as a localized currency string.
 *
 * Defaults to Costa Rican colón (`CRC`) with no decimal places — matches
 * the storefront's market (CR shipping zones, addresses, IVA-inclusive
 * pricing). Pass overrides for other locales/currencies if ever needed.
 */
export function formatPrice(
  value: number,
  options: Intl.NumberFormatOptions & { locale?: string } = {}
): string {
  const { locale = "es-CR", currency = "CRC", maximumFractionDigits = 0, ...rest } = options;

  return value.toLocaleString(locale, {
    style: "currency",
    currency,
    maximumFractionDigits,
    ...rest,
  });
}

/**
 * Format an XP balance with thousands separators, e.g. 12450 → "12,450".
 *
 * Grouped with `en-US` on purpose, not the storefront's `es-CR`: XP is a game
 * score rather than money, and the comma grouping is what makes a five-figure
 * total scannable at a glance in a leaderboard column. Negatives and fractions
 * are clamped away — XP is a non-negative integer everywhere it is stored.
 */
export function formatXp(value: number): string {
  return new Intl.NumberFormat("en-US").format(
    Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0
  );
}
