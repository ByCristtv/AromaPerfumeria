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
