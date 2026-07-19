/**
 * Ambient types for the ONVO embedded Web SDK loaded from
 * https://sdk.onvopay.com/sdk.js — it attaches a global `onvo` object.
 *
 * Only the surface we use is typed. The SDK renders every card field itself
 * (PCI: we never touch card data) and reports the outcome via onSuccess/onError,
 * but the webhook remains our source of truth, so the callback payloads are
 * intentionally left `unknown` — we don't branch on their contents.
 */

/** Config passed to `onvo.pay(...)`. */
export interface OnvoPayConfig {
  /** Publishable key (onvo_*_publishable_key_...). */
  publicKey: string;
  /** Payment intent id created server-side. */
  paymentIntentId: string;
  /** Onvo customer id associated with the intent. */
  customerId?: string;
  /** "one_time" for a single checkout charge. */
  paymentType: "one_time" | "recurring" | "subscription";
  /** true → we drive the charge with our own button via submitPayment(). */
  manualSubmit?: boolean;
  /** UI language, e.g. "es". */
  locale?: string;
  /** Fired when Onvo confirms the payment succeeded client-side. */
  onSuccess?: (data: unknown) => void;
  /** Fired on payment failure / invalid card / SDK error. */
  onError?: (data: unknown) => void;
}

/** Instance returned by `onvo.pay(...)`. */
export interface OnvoPayInstance {
  /** Mounts the payment form into the element matching `selector`. Chainable. */
  render: (selector: string) => OnvoPayInstance;
  /** Submits the charge (used with manualSubmit: true). */
  submitPayment: () => void;
}

export interface OnvoSdk {
  pay: (config: OnvoPayConfig) => OnvoPayInstance;
}

declare global {
  interface Window {
    /** Present once sdk.onvopay.com/sdk.js has loaded. */
    onvo?: OnvoSdk;
  }
}
