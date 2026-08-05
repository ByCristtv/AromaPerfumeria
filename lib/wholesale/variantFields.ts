/**
 * Parse + validate the two wholesale variant fields as they come off the admin
 * forms (raw string inputs), shared by ProductForm / VariantForm /
 * ProductEditForm so the rule lives in exactly one place.
 *
 * Rules (both fields optional, empty → NULL):
 *   - wholesale_price: when provided must be a number > 0. (The DB CHECK is
 *     `wholesale_price > 0`, same as retail price/offer_price — 0 is rejected.)
 *   - min_wholesale_quantity: when provided must be an integer >= 2. (A minimum
 *     of 1 would mean "wholesale at any quantity", which defeats the tier.)
 *
 * Both null is the normal "this variant isn't sold wholesale" state, and the
 * pricing engine only unlocks wholesale when BOTH are set (see
 * lib/pricing/wholesale.ts → isWholesaleConfigured).
 */

export interface WholesaleFieldValues {
  wholesale_price: number | null;
  min_wholesale_quantity: number | null;
}

export type ParseWholesaleResult =
  | { ok: true; values: WholesaleFieldValues }
  | { ok: false; message: string };

export function parseWholesaleFields(
  wholesalePriceRaw: string,
  minQuantityRaw: string
): ParseWholesaleResult {
  const priceStr = wholesalePriceRaw.trim();
  const minStr = minQuantityRaw.trim();

  let wholesale_price: number | null = null;
  if (priceStr !== "") {
    const n = Number(priceStr);
    if (!Number.isFinite(n) || n <= 0) {
      return {
        ok: false,
        message:
          "El precio mayorista debe ser un número mayor que 0 (o déjalo vacío).",
      };
    }
    wholesale_price = n;
  }

  let min_wholesale_quantity: number | null = null;
  if (minStr !== "") {
    const n = Number(minStr);
    if (!Number.isInteger(n) || n < 2) {
      return {
        ok: false,
        message:
          "La cantidad mínima mayorista debe ser un entero de 2 o más (o déjala vacía).",
      };
    }
    min_wholesale_quantity = n;
  }

  return { ok: true, values: { wholesale_price, min_wholesale_quantity } };
}

/** Hydrate a nullable numeric DB value into the string a controlled input wants. */
export function wholesaleFieldToInput(value: number | null | undefined): string {
  return value != null ? String(value) : "";
}
