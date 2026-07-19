import {
  OnvoApiError,
  cancelPaymentIntent,
  createOnvoCustomer,
  createPaymentIntent,
} from "@/lib/onvo/client";
import { getOnvoEnv } from "@/lib/onvo/env";
import { toCostaRicaE164 } from "@/lib/onvo/phone";
import { paymentProviderError } from "../errors";
import type {
  PaymentContext,
  PaymentPreparation,
  PaymentProcessor,
  PaymentRecord,
  PaymentUpdateResult,
} from "./types";

/** Onvo bills in the currency's smallest unit; our totals are whole CRC. */
function toCentimos(crc: number): number {
  return Math.round(crc * 100);
}

/**
 * Card / digital payments via the Onvo embedded Web SDK.
 *
 * Creates a customer + payment intent; the intent id feeds onvo.pay() in the
 * browser. The webhook remains the source of truth for paid state.
 */
export const onvoCardProcessor: PaymentProcessor = {
  method: "card",
  provider: "onvo",

  async createPayment(ctx: PaymentContext): Promise<PaymentPreparation> {
    return buildPreparation(ctx);
  },

  /**
   * Recreate the intent if and only if the total changed.
   *
   * `total` is the only thing an intent encodes, and it is already the computed
   * roll-up of subtotal + shipping + discount + tax. So this one predicate covers
   * every case that must recreate (total, cart contents, quantities, shipping
   * cost, and future discounts/coupons/taxes) and every case that must not
   * (address, district, name, phone, email, notes) — without a hand-maintained
   * field list that would drift as the order model grows.
   *
   * It's also more precise than a field list: a canton edit within the GAM zone
   * doesn't move the total, so the intent survives; San José → Limón crosses into
   * the rural zone, so it doesn't.
   *
   * Contact edits deliberately do NOT recreate. The Onvo customer then keeps the
   * contact info captured when the intent was made — accepted, because that object
   * is a payment-side convenience (already created fresh per checkout) while
   * `orders` stays the fulfillment source of truth. Updating it in place would
   * need a customer_id we don't store, and taking that id from the client would be
   * an IDOR into Onvo's customer objects.
   */
  async updatePayment(
    ctx: PaymentContext,
    previous: PaymentRecord
  ): Promise<PaymentUpdateResult> {
    if (previous.total === ctx.total && previous.reference) {
      return { changed: false };
    }

    // Build the replacement FIRST — if Onvo is down this throws before the caller
    // writes anything, leaving the order and its existing intent consistent.
    const preparation = await buildPreparation(ctx);

    // Only now is the old intent definitely superseded. Best-effort by contract.
    await onvoCardProcessor.releasePayment(previous);

    return { changed: true, preparation };
  },

  async releasePayment(previous: PaymentRecord): Promise<void> {
    if (!previous.reference) return;

    try {
      await cancelPaymentIntent(previous.reference, {
        reason: "Superseded by an updated checkout",
      });
    } catch (err) {
      // Swallow by design — see PaymentProcessor.releasePayment. An orphaned
      // unconfirmed intent is never charged and the webhook correlates via
      // metadata.orderId, so this costs us nothing but a log line.
      console.warn("[onvo-card] intent cancel failed (ignored, best-effort)", {
        provider: previous.provider,
        intentId: previous.reference,
        err,
      });
    }
  },
};

/**
 * Create a fresh Onvo customer + intent for the order's current total.
 *
 * Onvo has no reliable find-by-email (their list endpoint only supports cursor
 * pagination + createdAt filters), so a customer is created per intent and
 * attached to it — which also means a recreated intent picks up any edited
 * contact info for free.
 *
 * Throws CheckoutError (502) so the caller doesn't have to know about Onvo.
 */
async function buildPreparation(ctx: PaymentContext): Promise<PaymentPreparation> {
  try {
    const publicKey = getOnvoEnv().publicKey;

    const customer = await createOnvoCustomer({
      name: ctx.customer.name,
      email: ctx.customer.email,
      // Onvo requires E.164; the form collects local CR formatting.
      phone: toCostaRicaE164(ctx.customer.phone),
      address: { country: "CR" },
    });

    const intent = await createPaymentIntent({
      amount: toCentimos(ctx.total),
      currency: "CRC",
      description: `Pedido #${ctx.order_number} — Aroma Perfumería`,
      customerId: customer.id,
      // metadata.orderId is the webhook's actual lookup key — never drop it.
      metadata: {
        orderId: ctx.order_id,
        orderNumber: String(ctx.order_number),
      },
    });

    return {
      kind: "onvo_card",
      intent_id: intent.id,
      customer_id: customer.id,
      public_key: publicKey,
    };
  } catch (err) {
    console.error("[onvo-card] failed to prepare payment", {
      orderId: ctx.order_id,
      err,
    });
    throw paymentProviderError(
      err instanceof OnvoApiError ? `Onvo ${err.status}` : undefined
    );
  }
}
