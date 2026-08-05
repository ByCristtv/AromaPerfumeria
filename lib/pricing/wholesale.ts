/**
 * Wholesale (B2B) pricing engine — the single source of truth for "what does a
 * line cost?" on the client.
 *
 * ⚠ This mirrors the pricing branch inside the `place_order` Postgres RPC, which
 * is the AUTHORITATIVE calculation (the client never dictates prices — it sends
 * only variant_id + quantity, and the DB recomputes). Keep the two in lock-step:
 * if you change a rule here, change it in place_order too, or an eligible buyer
 * will be quoted one price in the cart and charged another at checkout.
 *
 * The rule (from the spec), applied per cart line:
 *   wholesale applies  ⇔  buyer is wholesale-eligible
 *                          AND variant.is_wholesale_enabled
 *                          AND variant.wholesale_price   IS NOT NULL
 *                          AND variant.min_wholesale_quantity IS NOT NULL
 *                          AND quantity >= variant.min_wholesale_quantity
 *   otherwise → retail  (offer_price when is_on_offer, else price)
 */

/** Pricing-relevant columns of a `product_variants` row. */
export interface VariantPricing {
  price: number;
  offer_price: number | null;
  is_on_offer: boolean;
  is_wholesale_enabled: boolean;
  wholesale_price: number | null;
  min_wholesale_quantity: number | null;
}

/** Fully-resolved pricing for one cart line. */
export interface LinePricing {
  quantity: number;
  /** Per-unit price actually charged. */
  unitPrice: number;
  /** Per-unit retail price (offer-aware) — what a non-wholesale buyer pays. */
  retailPrice: number;
  /** Whether the wholesale price was applied to this line. */
  wasWholesale: boolean;
  /** The variant is set up for wholesale (enabled + wholesale_price + min all present). */
  wholesaleConfigured: boolean;
  /** Wholesale unit price when configured, else null. */
  wholesalePrice: number | null;
  /** Minimum qty that unlocks wholesale when configured, else null. */
  minWholesaleQuantity: number | null;
  /**
   * How many more units the buyer must ADD to unlock the wholesale price:
   *   - a positive number when eligible + configured but quantity < min
   *   - 0 when wholesale is already applied
   *   - null when wholesale can never apply here (not eligible, or not configured)
   * Drives the "Agrega N más para el precio mayorista" helper text.
   */
  unitsToUnlock: number | null;
  /** unitPrice * quantity, rounded to 2 decimals (matches NUMERIC(12,2)). */
  lineTotal: number;
  /** retailPrice * quantity — the pre-wholesale cost, for showing savings. */
  retailLineTotal: number;
}

/** Aggregate pricing across a whole cart. */
export interface CartPricing {
  /** Per-line pricing keyed by variant_id. */
  lines: Record<string, LinePricing>;
  /** Sum of effective line totals — the amount the buyer pays for goods. */
  subtotal: number;
  /** Sum of retail line totals — what the same cart would cost at retail. */
  retailSubtotal: number;
  /** retailSubtotal - subtotal (>= 0). */
  wholesaleSavings: number;
  /** At least one line received the wholesale price. */
  hasWholesaleApplied: boolean;
  /** Whether the buyer was treated as wholesale-eligible. */
  eligible: boolean;
}

/** Round to 2 decimals so JS float arithmetic matches the DB's NUMERIC(12,2). */
function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Offer-aware retail unit price. */
export function resolveRetailPrice(
  v: Pick<VariantPricing, "price" | "offer_price" | "is_on_offer">
): number {
  return v.is_on_offer && v.offer_price != null ? v.offer_price : v.price;
}

/**
 * Whether a variant is sellable at wholesale at all — independent of buyer or
 * quantity. Requires the toggle ON and BOTH wholesale parameters set: a variant
 * with a wholesale_price but no minimum (or vice-versa) is not fully configured
 * and must fall back to retail rather than guess a threshold.
 */
export function isWholesaleConfigured(v: VariantPricing): boolean {
  return (
    v.is_wholesale_enabled &&
    v.wholesale_price != null &&
    v.min_wholesale_quantity != null &&
    v.min_wholesale_quantity > 0
  );
}

/**
 * Price a single cart line.
 *
 * @param v         Variant pricing columns.
 * @param quantity  Units of this variant in the cart (>= 1).
 * @param eligible  Whether the buyer is an approved wholesale account.
 */
export function resolveLinePricing(
  v: VariantPricing,
  quantity: number,
  eligible: boolean
): LinePricing {
  const retailPrice = resolveRetailPrice(v);
  const configured = isWholesaleConfigured(v);

  // Safe non-null locals once `configured` is true.
  const min = configured ? (v.min_wholesale_quantity as number) : null;
  const wholesalePrice = configured ? (v.wholesale_price as number) : null;

  const wasWholesale =
    eligible && configured && quantity >= (min as number);

  const unitPrice = wasWholesale ? (wholesalePrice as number) : retailPrice;

  // Only meaningful when wholesale COULD apply for this buyer + variant.
  let unitsToUnlock: number | null = null;
  if (eligible && configured) {
    unitsToUnlock = wasWholesale ? 0 : Math.max(0, (min as number) - quantity);
  }

  return {
    quantity,
    unitPrice,
    retailPrice,
    wasWholesale,
    wholesaleConfigured: configured,
    wholesalePrice,
    minWholesaleQuantity: min,
    unitsToUnlock,
    lineTotal: round2(unitPrice * quantity),
    retailLineTotal: round2(retailPrice * quantity),
  };
}

/**
 * Build a retail-only line without variant wholesale columns — used when the
 * buyer isn't eligible (so we never even fetch wholesale data) or when a
 * persisted cart item predates the wholesale fields.
 */
export function retailOnlyLine(
  retailPrice: number,
  quantity: number
): LinePricing {
  return {
    quantity,
    unitPrice: retailPrice,
    retailPrice,
    wasWholesale: false,
    wholesaleConfigured: false,
    wholesalePrice: null,
    minWholesaleQuantity: null,
    unitsToUnlock: null,
    lineTotal: round2(retailPrice * quantity),
    retailLineTotal: round2(retailPrice * quantity),
  };
}

/** One cart line's inputs for {@link priceCart}. */
export interface CartLineInput {
  variant_id: string;
  quantity: number;
  /** Full variant pricing when known (eligible path); null → retail fallback. */
  pricing: VariantPricing | null;
  /** Retail unit price to fall back on when `pricing` is null. */
  retailPrice: number;
}

/** Price a whole cart, producing per-line detail plus totals + savings. */
export function priceCart(
  items: CartLineInput[],
  eligible: boolean
): CartPricing {
  const lines: Record<string, LinePricing> = {};
  let subtotal = 0;
  let retailSubtotal = 0;
  let hasWholesaleApplied = false;

  for (const item of items) {
    const line =
      eligible && item.pricing
        ? resolveLinePricing(item.pricing, item.quantity, true)
        : retailOnlyLine(item.retailPrice, item.quantity);

    lines[item.variant_id] = line;
    subtotal += line.lineTotal;
    retailSubtotal += line.retailLineTotal;
    if (line.wasWholesale) hasWholesaleApplied = true;
  }

  subtotal = round2(subtotal);
  retailSubtotal = round2(retailSubtotal);

  return {
    lines,
    subtotal,
    retailSubtotal,
    wholesaleSavings: round2(retailSubtotal - subtotal),
    hasWholesaleApplied,
    eligible,
  };
}
