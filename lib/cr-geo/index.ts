/**
 * Costa Rica administrative geography — typed accessors.
 *
 * Use these from UI components (province → canton dropdowns) and from
 * validation (verify a submitted canton_code is real before sending to
 * place_order RPC).
 *
 * If we ever migrate to DB-backed geo, only this file changes —
 * callers keep the same accessor API.
 */

import { CANTONES, PROVINCES } from "./data";
import type { Canton, Province } from "./types";

export type { Canton, Province, District } from "./types";

/** All 7 CR provinces, in canonical order. */
export function getProvinces(): readonly Province[] {
  return PROVINCES;
}

/** Cantones for a given province, or empty array if province code unknown. */
export function getCantones(provinceCode: string | null | undefined): readonly Canton[] {
  if (!provinceCode) return [];
  return CANTONES.filter((c) => c.provinceCode === provinceCode);
}

/** Resolve a canton record from its code. Returns null if not found. */
export function findCanton(cantonCode: string | null | undefined): Canton | null {
  if (!cantonCode) return null;
  return CANTONES.find((c) => c.code === cantonCode) ?? null;
}

/** Resolve a province record from its code. Returns null if not found. */
export function findProvince(provinceCode: string | null | undefined): Province | null {
  if (!provinceCode) return null;
  return PROVINCES.find((p) => p.code === provinceCode) ?? null;
}

/**
 * Quick validator: is this a real CR canton code we know about?
 * Use in zod schemas to refuse obviously-fake input before hitting the RPC.
 */
export function isValidCantonCode(cantonCode: string): boolean {
  return CANTONES.some((c) => c.code === cantonCode);
}
