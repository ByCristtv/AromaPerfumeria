/**
 * Generic, table-agnostic pagination helpers shared by every URL-driven admin
 * list (stock movements, products, orders, …).
 *
 * The panels stay server-rendered + shareable by keeping page/search/filter state
 * in the query string. These helpers are the single source of truth for the param
 * names and the URL <-> state mapping, used by both the server pages (parse) and
 * the client islands / <Pagination> (build).
 *
 * Generalized from the original `lib/stockParams.ts` so new admin pages reuse one
 * implementation instead of copying the stock-specific version.
 */

/** Canonical query-string keys shared across admin lists. */
export const PAGE_PARAM = "page";
export const SEARCH_PARAM = "q";

/** Default rows per admin page. */
export const ADMIN_PAGE_SIZE = 20;

export type RawSearchParams = Record<string, string | string[] | undefined>;

/** First value of a possibly-repeated query param, trimmed. */
export function firstParam(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

/** Parse the 1-based page number (defaults to 1; never below 1). */
export function parsePage(params: RawSearchParams): number {
  const n = Number.parseInt(firstParam(params[PAGE_PARAM]), 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

/** Parse the free-text search term (empty → undefined). */
export function parseSearch(params: RawSearchParams): string | undefined {
  return firstParam(params[SEARCH_PARAM]) || undefined;
}

/** Parse a discrete filter param, falling back to `fallback` when absent. */
export function parseParam(
  params: RawSearchParams,
  key: string,
  fallback = ""
): string {
  return firstParam(params[key]) || fallback;
}

/**
 * Build a `?…` query string from the current params plus overrides. A value of
 * `undefined | null | ""` removes the key; `page=1` is dropped to keep URLs
 * canonical (page 1 is the bare URL). Any key may be overridden, so this serves
 * page changes, search updates, and filter toggles alike.
 */
export function buildQuery(
  current: URLSearchParams,
  overrides: Record<string, string | number | undefined | null>
): string {
  const next = new URLSearchParams(current.toString());

  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined || value === null || value === "") {
      next.delete(key);
    } else {
      next.set(key, String(value));
    }
  }

  if (next.get(PAGE_PARAM) === "1") next.delete(PAGE_PARAM);

  const qs = next.toString();
  return qs ? `?${qs}` : "";
}

/** One page of results plus the counters a paginated UI needs. */
export interface Paginated<T> {
  rows: T[];
  total: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
}

/**
 * Derive the counters for a requested page from the known total. Clamps the page
 * into range and returns the DB offset plus the 1-based display window (from–to).
 */
export function paginate(
  total: number,
  page: number,
  pageSize: number = ADMIN_PAGE_SIZE
): {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  offset: number;
  from: number;
  to: number;
} {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(1, Math.floor(page) || 1), totalPages);
  const offset = (currentPage - 1) * pageSize;
  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(currentPage * pageSize, total);
  return { currentPage, totalPages, pageSize, offset, from, to };
}
