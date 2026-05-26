/**
 * Onvo API types — based on https://docs.onvopay.com/llms-full.txt (2026).
 *
 * Names match Onvo's camelCase convention exactly. Don't snake_case at this
 * boundary — translate to/from our own conventions in the route handlers.
 */

/** A single line on a checkout session. */
export interface OnvoLineItem {
  quantity: number;
  /** Amount in smallest unit (céntimos for CRC: ₡5,000 → 500000). */
  unitAmount: number;
  currency: "CRC" | "USD";
  description?: string;
}

/** Input to POST /v1/checkout/sessions/one-time-link */
export interface OnvoCreateCheckoutSessionInput {
  lineItems: OnvoLineItem[];
  /** URL Onvo redirects to after successful payment. */
  redirectUrl: string;
  /** URL Onvo redirects to if the user cancels. Optional but recommended. */
  cancelUrl?: string;
  /**
   * Custom string key-value pairs. Forwarded to the underlying payment intent,
   * surfaced in webhook events as `data.metadata`. We use this to attach our
   * own order_id so the webhook handler can look up the order.
   */
  metadata?: Record<string, string>;
}

/** Response from POST /v1/checkout/sessions/one-time-link */
export interface OnvoCheckoutSession {
  id: string;
  /** Hosted-checkout URL to redirect the customer to. */
  url: string;
  /** Lifecycle status. Initial is 'open'. */
  status: "open" | "complete" | "expired" | string;
}

/**
 * Webhook event types we care about. Onvo may add more — code MUST treat
 * unknown types as a no-op, not an error (don't break their retry loop).
 */
export type OnvoWebhookEventType =
  | "payment-intent.succeeded"
  | "payment-intent.failed"
  | "payment-intent.deferred"
  | "checkout-session.succeeded"
  | "subscription.renewal.succeeded"
  | "subscription.renewal.failed"
  | "mobile-transfer.received";

/**
 * Generic webhook envelope. The shape of `data` depends on event type; we
 * keep it loose here and narrow per-event in the route handler.
 */
export interface OnvoWebhookEvent {
  type: OnvoWebhookEventType | string;
  data: {
    /** Object id — for payment-intent.* events this is the intent id; for
     *  checkout-session.* it's the session id. */
    id: string;
    amount?: number;
    currency?: string;
    status?: string;
    metadata?: Record<string, string>;
    /** Forward-compatible: any other fields Onvo includes. */
    [key: string]: unknown;
  };
}
