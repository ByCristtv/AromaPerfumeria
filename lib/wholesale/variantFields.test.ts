import { describe, it, expect } from "vitest";
import { parseWholesaleFields, wholesaleFieldToInput } from "./variantFields";

describe("parseWholesaleFields", () => {
  it("returns NULL for both when the inputs are empty (not sold wholesale)", () => {
    const r = parseWholesaleFields("", "");
    expect(r).toEqual({
      ok: true,
      values: { wholesale_price: null, min_wholesale_quantity: null },
    });
  });

  it("treats whitespace-only inputs as empty → NULL", () => {
    const r = parseWholesaleFields("   ", "  ");
    expect(r.ok && r.values).toEqual({
      wholesale_price: null,
      min_wholesale_quantity: null,
    });
  });

  it("parses a valid price + minimum", () => {
    const r = parseWholesaleFields("7000", "6");
    expect(r).toEqual({
      ok: true,
      values: { wholesale_price: 7000, min_wholesale_quantity: 6 },
    });
  });

  it("allows the two fields independently (price only, min only)", () => {
    expect(parseWholesaleFields("5000", "")).toEqual({
      ok: true,
      values: { wholesale_price: 5000, min_wholesale_quantity: null },
    });
    expect(parseWholesaleFields("", "4")).toEqual({
      ok: true,
      values: { wholesale_price: null, min_wholesale_quantity: 4 },
    });
  });

  it("rejects a price of 0 (DB CHECK requires > 0) rather than storing it", () => {
    const r = parseWholesaleFields("0", "");
    expect(r.ok).toBe(false);
  });

  it("rejects a negative price", () => {
    expect(parseWholesaleFields("-100", "").ok).toBe(false);
  });

  it("rejects a non-numeric price", () => {
    expect(parseWholesaleFields("abc", "").ok).toBe(false);
  });

  it("rejects a minimum below 2", () => {
    expect(parseWholesaleFields("", "1").ok).toBe(false);
    expect(parseWholesaleFields("", "0").ok).toBe(false);
  });

  it("rejects a non-integer minimum", () => {
    expect(parseWholesaleFields("", "2.5").ok).toBe(false);
  });

  it("accepts a minimum of exactly 2", () => {
    const r = parseWholesaleFields("", "2");
    expect(r.ok && r.values.min_wholesale_quantity).toBe(2);
  });
});

describe("wholesaleFieldToInput", () => {
  it("maps NULL/undefined to an empty string (keeps inputs controlled)", () => {
    expect(wholesaleFieldToInput(null)).toBe("");
    expect(wholesaleFieldToInput(undefined)).toBe("");
  });

  it("stringifies a numeric value", () => {
    expect(wholesaleFieldToInput(7000)).toBe("7000");
    expect(wholesaleFieldToInput(0)).toBe("0");
  });
});
