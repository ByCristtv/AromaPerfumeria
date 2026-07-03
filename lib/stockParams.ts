/**
 * URL <-> state mapping for the admin `/admin/stock` movements panel.
 *
 * The panel is driven by the query string (`?q=` search, `?page=`) so it stays
 * server-renderable and shareable, exactly like the public catalog. These
 * helpers are the single source of truth for the param names, shared by the
 * server page (parse) and the client toolbar/pagination (build).
 */

export const STOCK_PARAM = {
  query: "q",
  page: "page",
} as const;

export type RawSearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

/** Parse the free-text search term (empty → undefined). */
export function parseStockSearch(params: RawSearchParams): string | undefined {
  return first(params[STOCK_PARAM.query]) || undefined;
}

/** Parse the 1-based page number (defaults to 1; never below 1). */
export function parseStockPage(params: RawSearchParams): number {
  const n = Number.parseInt(first(params[STOCK_PARAM.page]), 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

/**
 * Build a `?…` query string from the current params plus overrides. Empty /
 * undefined removes the key; `page=1` is dropped to keep URLs canonical.
 */
export function buildStockQuery(
  current: URLSearchParams,
  overrides: Partial<Record<keyof typeof STOCK_PARAM, string | number | undefined>>
): string {
  const next = new URLSearchParams(current.toString());

  for (const [key, paramName] of Object.entries(STOCK_PARAM)) {
    if (!(key in overrides)) continue;
    const value = overrides[key as keyof typeof STOCK_PARAM];
    if (value === undefined || value === "" || value === null) {
      next.delete(paramName);
    } else {
      next.set(paramName, String(value));
    }
  }

  if (next.get(STOCK_PARAM.page) === "1") next.delete(STOCK_PARAM.page);

  const qs = next.toString();
  return qs ? `?${qs}` : "";
}
