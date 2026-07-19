import type {
  CheckoutCustomer,
  PaymentMethodId,
  PaymentProvider,
} from "../types";

/**
 * Everything a processor needs to prepare a payment, with the order already in
 * its FINAL intended shape (totals recomputed) but not necessarily written yet.
 *
 * On the update path this context is built from values that have been computed
 * but not persisted — see checkoutService's ordering rationale. A processor must
 * therefore not assume it can re-read the order from the DB and see `total`.
 */
export interface PaymentContext {
  order_id: string;
  order_number: number;
  /** Authoritative order total in whole CRC (NOT céntimos). */
  total: number;
  customer: CheckoutCustomer;
}

/**
 * What the client needs to actually pay. Discriminated on `kind` so the client
 * renders the right surface with no `as` casts and no boolean flags.
 */
export type PaymentPreparation =
  | {
      kind: "onvo_card";
      /** Feeds onvo.pay({ paymentIntentId }) in the embedded Web SDK. */
      intent_id: string;
      customer_id: string;
      /** Onvo publishable key — safe in the browser. */
      public_key: string;
    }
  | {
      kind: "manual_sinpe";
      /** Where the client should navigate to show transfer instructions. */
      instructions_path: string;
    };

/**
 * Result of re-preparing payment after the order changed.
 *
 * `{ changed: false }` means "what you already have is still valid" — the client
 * keeps its mounted SDK and we make zero provider calls. This is the answer for
 * a double-click, a no-op re-submit, or any edit that doesn't move the total, and
 * it's also why we never need to persist the Onvo customer_id: we only ever hand
 * back a preparation we just built.
 */
export type PaymentUpdateResult =
  | { changed: true; preparation: PaymentPreparation }
  | { changed: false };

/**
 * What we know about the payment already attached to a pending order, read back
 * from the order row. `reference` is orders.payment_reference (the Onvo intent
 * id for card orders; null for SINPE, which has no provider-side object).
 */
export interface PaymentRecord {
  provider: PaymentProvider;
  reference: string | null;
  /** The order's total at the time this payment was prepared, in whole CRC. */
  total: number;
}

/**
 * One payment method, self-contained. checkoutService resolves a processor from
 * the registry and invokes it — it never branches on provider, so adding PayPal
 * is a new file plus a registry entry, with no edit to checkout business logic
 * (Open/Closed).
 *
 * Intentionally minimal (ISP): there is no retryPayment() or finalizePayment()
 * because nothing would call them today. Retry lives in
 * app/api/checkout/retry/[orderId] (still on the hosted flow) and finalization
 * happens in the Onvo webhook, which is provider-agnostic already — it correlates
 * via metadata.orderId. SINPE finalization is a manual admin action. Add methods
 * when they get a caller, not before.
 */
export interface PaymentProcessor {
  /** UI-facing method this processor serves. */
  readonly method: PaymentMethodId;
  /** Value stamped on orders.payment_provider. */
  readonly provider: PaymentProvider;

  /** Prepare payment for a freshly placed order. May throw CheckoutError. */
  createPayment(ctx: PaymentContext): Promise<PaymentPreparation>;

  /**
   * Re-prepare after the order changed. Implementations SHOULD return
   * `{ changed: false }` when nothing payment-relevant moved. May throw
   * CheckoutError — callers must invoke this BEFORE persisting order changes so
   * a provider failure leaves nothing written.
   */
  updatePayment(
    ctx: PaymentContext,
    previous: PaymentRecord
  ): Promise<PaymentUpdateResult>;

  /**
   * Best-effort teardown of provider-side objects for a payment we're abandoning.
   *
   * MUST NOT throw — implementations catch and log internally. The signature is
   * the contract: a provider refusing to cancel must never block updating the
   * order, switching method, creating a replacement payment, or completing
   * checkout.
   */
  releasePayment(previous: PaymentRecord): Promise<void>;
}
