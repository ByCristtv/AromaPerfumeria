import { signOrderToken } from "@/lib/orders/tokens";
import type {
  PaymentContext,
  PaymentPreparation,
  PaymentProcessor,
  PaymentUpdateResult,
} from "./types";

/**
 * Build the instructions URL. The token lets a guest reach the page without an
 * account — same HMAC mechanism as /orders/[id]?token=.
 */
function instructionsPath(orderId: string): string {
  const token = signOrderToken(orderId);
  return `/checkout/sinpe/${orderId}?token=${encodeURIComponent(token)}`;
}

/**
 * Manual SINPE Móvil: the customer transfers the total themselves and sends proof
 * via WhatsApp; an admin validates it and flips payment_status.
 *
 * Deliberately touches NO payment provider — no Onvo customer, no intent, no SDK.
 * The only thing this "prepares" is where to send the customer next, which is why
 * every method here is synchronous work in an async signature.
 *
 * Stock is still reserved by place_order exactly as with card, protecting against
 * overselling while the transfer is in flight. Note that these orders are exempt
 * from sweep_abandoned_orders() (it filters payment_provider='onvo'), which is
 * intentional: a customer can't realistically transfer and get manually validated
 * inside the 30-minute window. They stay pending until an admin acts.
 */
export const sinpeProcessor: PaymentProcessor = {
  method: "sinpe",
  provider: "manual_sinpe",

  async createPayment(ctx: PaymentContext): Promise<PaymentPreparation> {
    return {
      kind: "manual_sinpe",
      instructions_path: instructionsPath(ctx.order_id),
    };
  },

  /**
   * Nothing provider-side can go stale: the instructions page reads the order's
   * live total and number when it renders, so an edited order needs no re-prep.
   * We still hand back a preparation (rather than `{ changed: false }`) because
   * it's free and keeps the client's redirect target unconditionally present.
   */
  async updatePayment(ctx: PaymentContext): Promise<PaymentUpdateResult> {
    return {
      changed: true,
      preparation: {
        kind: "manual_sinpe",
        instructions_path: instructionsPath(ctx.order_id),
      },
    };
  },

  /** No provider-side object exists to release. */
  async releasePayment(): Promise<void> {
    // Intentionally empty — see the doc comment above. Nothing to tear down.
  },
};
