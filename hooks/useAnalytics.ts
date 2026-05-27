"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

/**
 * Hooks around the existing analytics_* RPCs (defined in supabase/schema.sql).
 *
 * All three return arrays. analytics_revenue_summary always returns a
 * single-row array (or empty if no orders match) — the hook flattens it
 * to a single object | null for cleaner consumer code.
 *
 * RLS allows admins to read orders/order_items, so these queries succeed
 * for admin sessions. They'd return 0 rows for non-admins. Routing-level
 * gating (proxy.ts) prevents non-admins from reaching the dashboard.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types from generated DB
// ─────────────────────────────────────────────────────────────────────────────

export type RevenueSummary =
  Database["public"]["Functions"]["analytics_revenue_summary"]["Returns"][number];

export type BestSellerRow =
  Database["public"]["Functions"]["analytics_best_sellers"]["Returns"][number];

export type LowStockRow =
  Database["public"]["Functions"]["analytics_low_stock"]["Returns"][number];

// ─────────────────────────────────────────────────────────────────────────────
// useRevenueSummary
// ─────────────────────────────────────────────────────────────────────────────
// `since` is a JS Date (or null for all-time). RPC defaults to now() - 30 days
// if you pass undefined; we explicitly skip the param for the all-time case.

interface UseRevenueSummaryArgs {
  since: Date | null;
}

async function fetchRevenueSummary(
  since: Date | null
): Promise<RevenueSummary | null> {
  const { data, error } = await supabase.rpc(
    "analytics_revenue_summary",
    since ? { p_since: since.toISOString() } : {}
  );
  if (error) throw error;
  return data && data.length > 0 ? data[0] : null;
}

export function useRevenueSummary({ since }: UseRevenueSummaryArgs) {
  return useQuery({
    queryKey: ["analytics", "revenue-summary", since?.toISOString() ?? "all"],
    queryFn: () => fetchRevenueSummary(since),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// useBestSellers
// ─────────────────────────────────────────────────────────────────────────────

interface UseBestSellersArgs {
  since: Date | null;
  limit?: number;
}

async function fetchBestSellers(
  since: Date | null,
  limit: number
): Promise<BestSellerRow[]> {
  const args: { p_limit: number; p_since?: string } = { p_limit: limit };
  if (since) args.p_since = since.toISOString();
  const { data, error } = await supabase.rpc("analytics_best_sellers", args);
  if (error) throw error;
  return data ?? [];
}

export function useBestSellers({ since, limit = 10 }: UseBestSellersArgs) {
  return useQuery({
    queryKey: [
      "analytics",
      "best-sellers",
      since?.toISOString() ?? "all",
      limit,
    ],
    queryFn: () => fetchBestSellers(since, limit),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// useLowStock
// ─────────────────────────────────────────────────────────────────────────────
// Stock state is "now" — no date filter. Threshold is configurable but
// defaults to 5 (matches the RPC's own default).

interface UseLowStockArgs {
  threshold?: number;
}

async function fetchLowStock(threshold: number): Promise<LowStockRow[]> {
  const { data, error } = await supabase.rpc("analytics_low_stock", {
    p_threshold: threshold,
  });
  if (error) throw error;
  return data ?? [];
}

export function useLowStock({ threshold = 5 }: UseLowStockArgs = {}) {
  return useQuery({
    queryKey: ["analytics", "low-stock", threshold],
    queryFn: () => fetchLowStock(threshold),
    staleTime: 30_000,
  });
}
