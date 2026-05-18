/**
 * Format a numeric value as a localized currency string.
 *
 * Defaults to Argentine peso (`ARS`) with no decimal places, matching
 * the current storefront. Pass overrides if you need a different locale
 * or currency.
 */
export function formatPrice(
  value: number,
  options: Intl.NumberFormatOptions & { locale?: string } = {}
): string {
  const { locale = "es-AR", currency = "ARS", maximumFractionDigits = 0, ...rest } = options;

  return value.toLocaleString(locale, {
    style: "currency",
    currency,
    maximumFractionDigits,
    ...rest,
  });
}
