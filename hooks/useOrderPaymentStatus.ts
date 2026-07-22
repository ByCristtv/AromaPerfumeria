"use client";

import { useQuery } from "@tanstack/react-query";
import type { Database } from "@/types/database";

type PaymentStatus = Database["public"]["Enums"]["payment_status"];
type OrderStatus = Database["public"]["Enums"]["order_status"];

/** Live status fields returned by GET /api/orders/[id]/status. */
export interface OrderPaymentStatus {
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  payment_provider: string | null;
}

interface UseOrderPaymentStatusArgs {
  orderId: string;
  /** HMAC token from the URL, forwarded so guest callers can authorize. */
  token?: string;
  /** Server-rendered status, used as initialData so the first paint is instant
   *  and flicker-free. */
  initial: OrderPaymentStatus;
}

/** How often to re-check a pending ONVO payment (ms). */
const POLL_INTERVAL_MS = 2000;

export const orderPaymentStatusKey = (orderId: string) =>
  ["order-payment-status", orderId] as const;

/**
 * Returns true only for orders that can still flip to paid/failed via the ONVO
 * webhook — i.e. the *only* case worth polling.
 *
 * Deliberately excludes:
 *   - already paid / failed / refunded payments (terminal)
 *   - denied or otherwise non-pending orders (cancelled, shipped, …)
 *   - SINPE / manual orders (payment_provider !== "onvo") — confirmed by an
 *     admin, never by a webhook, so polling would spin forever.
 */
export function shouldPollPayment(status: OrderPaymentStatus): boolean {
  return (
    status.payment_provider === "onvo" &&
    status.payment_status === "pending" &&
    status.order_status === "pending"
  );
}

async function fetchOrderPaymentStatus(
  orderId: string,
  token: string | undefined
): Promise<OrderPaymentStatus> {
  const qs = token ? `?token=${encodeURIComponent(token)}` : "";
  const res = await fetch(`/api/orders/${orderId}/status${qs}`, {
    // Never serve a stale cached status while polling.
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`status ${res.status}`);
  }
  return (await res.json()) as OrderPaymentStatus;
}

/**
 * Polls an order's payment status via TanStack Query and stops the moment it
 * becomes terminal.
 *
 * Efficiency: the query only ever hits the network when the *seed* status is a
 * pollable ONVO payment (`enabled`). Terminal orders (paid/failed/denied) and
 * SINPE orders read straight from `initialData` and issue zero requests.
 *
 * Resilience: transient network blips are retried with backoff and never
 * surface as UI errors — the last known status keeps rendering, and polling
 * continues once connectivity returns.
 */
export function useOrderPaymentStatus({
  orderId,
  token,
  initial,
}: UseOrderPaymentStatusArgs) {
  const query = useQuery({
    queryKey: orderPaymentStatusKey(orderId),
    queryFn: () => fetchOrderPaymentStatus(orderId, token),
    initialData: initial,
    // If the order can't change, don't open the query at all — initialData is
    // the final answer.
    enabled: shouldPollPayment(initial),
    // Always consider the status stale so each interval genuinely refetches.
    staleTime: 0,
    // Poll while pollable, then return false to halt immediately on terminal.
    refetchInterval: (q) => {
      const data = q.state.data;
      if (!data) return POLL_INTERVAL_MS;
      return shouldPollPayment(data) ? POLL_INTERVAL_MS : false;
    },
    // Keep polling even if the tab is briefly backgrounded during redirect.
    refetchIntervalInBackground: true,
    // Retry transient failures generously and quietly.
    retry: true,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
  });

  const status: OrderPaymentStatus = query.data ?? initial;

  return {
    status,
    /** True while we're actively waiting for webhook confirmation. */
    isConfirming: shouldPollPayment(status),
    isPaid: status.payment_status === "paid",
    isFailed:
      status.payment_status === "failed" || status.order_status === "denied",
  };
}
