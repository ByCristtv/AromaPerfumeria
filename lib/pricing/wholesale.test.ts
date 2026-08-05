import { describe, it, expect } from "vitest";
import {
  resolveRetailPrice,
  isWholesaleConfigured,
  resolveLinePricing,
  retailOnlyLine,
  priceCart,
  type VariantPricing,
} from "./wholesale";

/**
 * A fully wholesale-configured variant: ₡10 000 retail, ₡7 000 wholesale once
 * the buyer takes 6+. Tests clone + tweak this for each scenario.
 */
const wholesaleVariant: VariantPricing = {
  price: 10_000,
  offer_price: null,
  is_on_offer: false,
  is_wholesale_enabled: true,
  wholesale_price: 7_000,
  min_wholesale_quantity: 6,
};

describe("resolveRetailPrice", () => {
  it("uses the base price when not on offer", () => {
    expect(resolveRetailPrice(wholesaleVariant)).toBe(10_000);
  });

  it("uses offer_price when on offer", () => {
    expect(
      resolveRetailPrice({ price: 10_000, offer_price: 8_000, is_on_offer: true })
    ).toBe(8_000);
  });

  it("ignores offer_price when is_on_offer is false", () => {
    expect(
      resolveRetailPrice({ price: 10_000, offer_price: 8_000, is_on_offer: false })
    ).toBe(10_000);
  });

  it("falls back to base price when on offer but offer_price is null", () => {
    expect(
      resolveRetailPrice({ price: 10_000, offer_price: null, is_on_offer: true })
    ).toBe(10_000);
  });
});

describe("isWholesaleConfigured", () => {
  it("is true when enabled with both wholesale_price and min set", () => {
    expect(isWholesaleConfigured(wholesaleVariant)).toBe(true);
  });

  it("is false when the toggle is off", () => {
    expect(
      isWholesaleConfigured({ ...wholesaleVariant, is_wholesale_enabled: false })
    ).toBe(false);
  });

  it("is false when wholesale_price is null", () => {
    expect(
      isWholesaleConfigured({ ...wholesaleVariant, wholesale_price: null })
    ).toBe(false);
  });

  it("is false when min_wholesale_quantity is null", () => {
    expect(
      isWholesaleConfigured({ ...wholesaleVariant, min_wholesale_quantity: null })
    ).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// The four scenarios called out in the task spec.
// ─────────────────────────────────────────────────────────────────────────────

describe("resolveLinePricing — required scenarios", () => {
  it("[1] standard (ineligible) user gets retail regardless of quantity", () => {
    for (const qty of [1, 6, 50, 999]) {
      const line = resolveLinePricing(wholesaleVariant, qty, /* eligible */ false);
      expect(line.unitPrice).toBe(10_000);
      expect(line.wasWholesale).toBe(false);
      // Not eligible → no unlock hint at all.
      expect(line.unitsToUnlock).toBeNull();
      expect(line.lineTotal).toBe(10_000 * qty);
    }
  });

  it("[2] approved wholesale user below the minimum gets retail", () => {
    const line = resolveLinePricing(wholesaleVariant, 5, /* eligible */ true);
    expect(line.unitPrice).toBe(10_000);
    expect(line.wasWholesale).toBe(false);
    expect(line.wholesaleConfigured).toBe(true);
    // Needs one more unit to reach the minimum of 6.
    expect(line.unitsToUnlock).toBe(1);
  });

  it("[3] approved wholesale user at/above the minimum gets the wholesale price", () => {
    const atMin = resolveLinePricing(wholesaleVariant, 6, true);
    expect(atMin.unitPrice).toBe(7_000);
    expect(atMin.wasWholesale).toBe(true);
    expect(atMin.unitsToUnlock).toBe(0);
    expect(atMin.lineTotal).toBe(7_000 * 6);

    const aboveMin = resolveLinePricing(wholesaleVariant, 10, true);
    expect(aboveMin.unitPrice).toBe(7_000);
    expect(aboveMin.wasWholesale).toBe(true);
  });

  it("[4] wholesale user gets retail when the variant is not wholesale-enabled", () => {
    const disabled = { ...wholesaleVariant, is_wholesale_enabled: false };
    for (const qty of [1, 6, 100]) {
      const line = resolveLinePricing(disabled, qty, true);
      expect(line.unitPrice).toBe(10_000);
      expect(line.wasWholesale).toBe(false);
      expect(line.wholesaleConfigured).toBe(false);
      // Wholesale can never apply → no unlock hint.
      expect(line.unitsToUnlock).toBeNull();
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Additional edge cases that guard the money path.
// ─────────────────────────────────────────────────────────────────────────────

describe("resolveLinePricing — edges", () => {
  it("eligible + configured but wholesale_price null → retail, not configured", () => {
    const line = resolveLinePricing(
      { ...wholesaleVariant, wholesale_price: null },
      50,
      true
    );
    expect(line.unitPrice).toBe(10_000);
    expect(line.wasWholesale).toBe(false);
    expect(line.unitsToUnlock).toBeNull();
  });

  it("eligible but min_wholesale_quantity null → retail (no assumed threshold)", () => {
    const line = resolveLinePricing(
      { ...wholesaleVariant, min_wholesale_quantity: null },
      50,
      true
    );
    expect(line.unitPrice).toBe(10_000);
    expect(line.wasWholesale).toBe(false);
  });

  it("wholesale price wins over an active retail offer", () => {
    // Retail offer would be ₡8 000, but a qualifying wholesale line pays ₡7 000.
    const onOffer: VariantPricing = {
      ...wholesaleVariant,
      is_on_offer: true,
      offer_price: 8_000,
    };
    const line = resolveLinePricing(onOffer, 6, true);
    expect(line.retailPrice).toBe(8_000);
    expect(line.unitPrice).toBe(7_000);
    expect(line.wasWholesale).toBe(true);
    // Savings are measured against the offer retail, not the list price.
    expect(line.retailLineTotal).toBe(8_000 * 6);
    expect(line.lineTotal).toBe(7_000 * 6);
  });

  it("below-min eligible line reports the exact shortfall", () => {
    expect(resolveLinePricing(wholesaleVariant, 1, true).unitsToUnlock).toBe(5);
    expect(resolveLinePricing(wholesaleVariant, 4, true).unitsToUnlock).toBe(2);
  });
});

describe("retailOnlyLine", () => {
  it("produces a retail line with no wholesale metadata", () => {
    const line = retailOnlyLine(12_500, 3);
    expect(line.unitPrice).toBe(12_500);
    expect(line.retailPrice).toBe(12_500);
    expect(line.wasWholesale).toBe(false);
    expect(line.wholesaleConfigured).toBe(false);
    expect(line.unitsToUnlock).toBeNull();
    expect(line.lineTotal).toBe(37_500);
  });
});

describe("priceCart", () => {
  const cart = [
    { variant_id: "a", quantity: 6, pricing: wholesaleVariant, retailPrice: 10_000 },
    {
      variant_id: "b",
      quantity: 2,
      pricing: { ...wholesaleVariant, wholesale_price: 3_000, min_wholesale_quantity: 3 },
      retailPrice: 10_000,
    },
  ];

  it("applies wholesale per line and aggregates savings for eligible buyers", () => {
    const pricing = priceCart(cart, /* eligible */ true);

    // Line a qualifies (6 >= 6) → ₡7 000; line b does not (2 < 3) → retail.
    expect(pricing.lines.a.wasWholesale).toBe(true);
    expect(pricing.lines.b.wasWholesale).toBe(false);
    expect(pricing.lines.b.unitsToUnlock).toBe(1);

    // subtotal = 6*7000 + 2*10000 = 62 000 ; retail = 6*10000 + 2*10000 = 80 000
    expect(pricing.subtotal).toBe(62_000);
    expect(pricing.retailSubtotal).toBe(80_000);
    expect(pricing.wholesaleSavings).toBe(18_000);
    expect(pricing.hasWholesaleApplied).toBe(true);
    expect(pricing.eligible).toBe(true);
  });

  it("charges full retail with zero savings for ineligible buyers", () => {
    const pricing = priceCart(cart, /* eligible */ false);
    expect(pricing.subtotal).toBe(80_000);
    expect(pricing.retailSubtotal).toBe(80_000);
    expect(pricing.wholesaleSavings).toBe(0);
    expect(pricing.hasWholesaleApplied).toBe(false);
    expect(Object.values(pricing.lines).every((l) => !l.wasWholesale)).toBe(true);
  });

  it("falls back to retailPrice when a line has no fetched pricing", () => {
    const pricing = priceCart(
      [{ variant_id: "z", quantity: 4, pricing: null, retailPrice: 5_000 }],
      true
    );
    expect(pricing.lines.z.unitPrice).toBe(5_000);
    expect(pricing.subtotal).toBe(20_000);
  });
});
