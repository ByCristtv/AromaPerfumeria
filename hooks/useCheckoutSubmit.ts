"use client";

import { useMutation } from "@tanstack/react-query";
import type { CheckoutPayload } from "@/schemas/checkout";

/**
 * Successful response shape from POST /api/checkout/session.
 * Mirrors what the route returns on 200.
 */
export interface CheckoutSubmitResponse {
  order_id: string;
  order_number: number;
  subtotal: number;
  shipping_cost: number;
  total: number;
  item_count: number;
  /**
   * Payment provider URL to redirect to. Always null until Phase 5 wires Onvo.
   * Once populated, the client should `window.location.assign(payment_url)`
   * instead of navigating to /orders/[id] directly.
   */
  payment_url: string | null;
}

/**
 * Structured error thrown by the mutation. Includes the HTTP status so
 * callers can decide whether to show "stock issue, refresh cart" vs
 * generic "try again."
 */
export interface CheckoutSubmitError {
  /** Machine-readable code from the route (e.g. 'stock_unavailable'). */
  code: string;
  /** User-facing Spanish message safe to display. */
  message: string;
  /** Field-level zod errors if validation failed. */
  details?: Record<string, string[] | undefined>;
  /** Raw error hint (dev only). */
  hint?: string;
  status: number;
}

async function postCheckoutSession(
  payload: CheckoutPayload
): Promise<CheckoutSubmitResponse> {
  const res = await fetch("/api/checkout/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as Partial<
      CheckoutSubmitError & { error: string }
    >;
    const err: CheckoutSubmitError = {
      code: body.error ?? "unknown",
      message:
        body.message ??
        "Ocurrió un error inesperado. Por favor intenta de nuevo.",
      details: body.details,
      hint: body.hint,
      status: res.status,
    };
    console.error("Checkout submission error:", err);
    throw err;
    
  }

  return (await res.json()) as CheckoutSubmitResponse;
}

/**
 * TanStack mutation for the checkout submit. Use from CheckoutClient:
 *
 *   const submit = useCheckoutSubmit();
 *   submit.mutate(payload, { onSuccess, onError });
 *
 * Returns the standard mutation surface: { mutate, isPending, error, data, ... }.
 */
export function useCheckoutSubmit() {
  return useMutation<CheckoutSubmitResponse, CheckoutSubmitError, CheckoutPayload>({
    mutationFn: postCheckoutSession,
  });
}
