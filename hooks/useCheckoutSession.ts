"use client";

import { useCallback, useState } from "react";
import type { PaymentPreparation } from "@/lib/checkout/payments/types";
import type { PaymentMethod } from "@/schemas/checkout";

/**
 * The live checkout's pending order, as the browser remembers it.
 *
 * `payment` is kept so a refresh on the payment step can re-mount the Onvo SDK
 * without a round-trip — the server only re-sends a preparation when something
 * actually changed.
 */
export interface CheckoutSessionState {
  order_id: string;
  order_token: string;
  method: PaymentMethod;
  payment: PaymentPreparation | null;
}

/**
 * sessionStorage, deliberately — and this is load-bearing, not incidental:
 *
 *   - Per TAB. Two tabs checking out get two independent pending orders instead
 *     of fighting over one. A cookie is shared across tabs and would cause
 *     exactly the interference we're avoiding; localStorage has the same defect.
 *   - Survives reload, so refreshing the payment step rehydrates rather than
 *     stranding the customer or minting a second order.
 *
 * The order_token is an HMAC already exposed in /orders/[id]?token= URLs, so
 * storing it here adds no new exposure class.
 */
const STORAGE_KEY = "aroma.checkout.session";

function read(): CheckoutSessionState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CheckoutSessionState) : null;
  } catch {
    // Corrupt or unavailable storage (private mode, quota, hand-edited value)
    // must never break checkout — degrade to "no session" and place a new order.
    return null;
  }
}

/**
 * Owns the checkout's pending-order reference. The ONLY module that writes the
 * storage key.
 *
 * The reference is valid ONLY while the order is live. Callers must `clear()` the
 * moment it reaches a terminal state (paid, cancelled, expired, denied) or the
 * checkout otherwise ends — otherwise a customer who completes an order and comes
 * back to /checkout would try to resume a finished one and eat a 409.
 */
export function useCheckoutSession() {
  // Lazy init: on the server this is null, and on the client's first render the
  // consumer renders nothing until its mount guard flips, so there's no
  // hydration mismatch to reconcile.
  const [session, setSession] = useState<CheckoutSessionState | null>(read);

  const save = useCallback((next: CheckoutSessionState) => {
    setSession(next);
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (err) {
      // In-memory state still works for this tab; only reload-survival is lost.
      console.warn("[checkout] could not persist session", err);
    }
  }, []);

  const clear = useCallback(() => {
    setSession(null);
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Nothing actionable — the in-memory clear above is what gates reuse.
    }
  }, []);

  return { session, save, clear };
}
