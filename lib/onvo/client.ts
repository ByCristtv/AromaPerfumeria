import { getOnvoEnv } from "./env";
import type {
  OnvoCancelPaymentIntentInput,
  OnvoCheckoutSession,
  OnvoCreateCheckoutSessionInput,
  OnvoCreateCustomerInput,
  OnvoCreatePaymentIntentInput,
  OnvoCustomer,
  OnvoPaymentIntent,
} from "./types";

/**
 * Thrown when an Onvo API call returns a non-2xx response. The route handler
 * catches this to convert into a friendly HTTP response and trigger the
 * order rollback (restore stock, deny order).
 */
export class OnvoApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
    message: string
  ) {
    super(message);
    this.name = "OnvoApiError";
  }
}

/**
 * Low-level request helper. Adds Bearer auth + Content-Type, throws on non-2xx.
 *
 * NOTE: server-side only. Calling from a Client Component would expose the
 * API key (which we prevent via the missing NEXT_PUBLIC_ prefix).
 */
async function onvoRequest<T>(path: string, init: RequestInit): Promise<T> {
  const env = getOnvoEnv();
  const url = `${env.apiUrl}/v1${path}`;

  const res = await fetch(url, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${env.apiKey}`,
      "Content-Type": "application/json",
    },
    // Onvo calls happen at request time, not at build time.
    cache: "no-store",
  });

  if (!res.ok) {
    const body: unknown = await res.json().catch(() => null);
    throw new OnvoApiError(
      res.status,
      body,
      `Onvo API ${res.status} on ${path}`
    );
  }

  return (await res.json()) as T;
}

/**
 * Create a hosted checkout session for a one-time payment.
 *
 * Onvo returns `{ id, url, status }`. The `url` is what we redirect the
 * customer to — Onvo hosts the actual payment form there.
 *
 * See https://docs.onvopay.com/checkout/overview and /llms-full.txt.
 */
export async function createCheckoutSession(
  input: OnvoCreateCheckoutSessionInput
): Promise<OnvoCheckoutSession> {
  return onvoRequest<OnvoCheckoutSession>("/checkout/sessions/one-time-link", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/**
 * Create an Onvo customer for the embedded (Web SDK) checkout flow.
 *
 * Onvo has no reliable "find by email" lookup (the list endpoint only supports
 * cursor pagination + createdAt filters), so we create a fresh customer per
 * checkout and attach it to the payment intent. See lib/onvo docs / the
 * checkout migration plan for the rationale.
 */
export async function createOnvoCustomer(
  input: OnvoCreateCustomerInput
): Promise<OnvoCustomer> {
  return onvoRequest<OnvoCustomer>("/customers", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/**
 * Create a one-time Payment Intent. Returned `id` is passed to the Web SDK
 * (`onvo.pay({ paymentIntentId })`) which renders the card fields and submits
 * the charge. Capture is automatic (we omit captureMethod) so the payment
 * settles immediately — matching the previous hosted-checkout behavior.
 *
 * See https://docs.onvopay.com — POST /v1/payment-intents.
 */
export async function createPaymentIntent(
  input: OnvoCreatePaymentIntentInput
): Promise<OnvoPaymentIntent> {
  return onvoRequest<OnvoPaymentIntent>("/payment-intents", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/**
 * Cancel a payment intent that will never be confirmed — the order's total moved
 * (so it needs a fresh intent), the customer switched to SINPE, or the order was
 * cancelled outright.
 *
 * Callers MUST treat this as best-effort: see releasePayment() in
 * lib/checkout/payments. A stranded unconfirmed intent is harmless (it is never
 * charged, and the webhook correlates via metadata.orderId, not the intent id),
 * whereas letting an Onvo hiccup here block the customer from finishing their
 * purchase is not.
 *
 * See https://docs.onvopay.com — POST /v1/payment-intents/{id}/cancel.
 */
export async function cancelPaymentIntent(
  paymentIntentId: string,
  input: OnvoCancelPaymentIntentInput = {}
): Promise<OnvoPaymentIntent> {
  return onvoRequest<OnvoPaymentIntent>(
    `/payment-intents/${encodeURIComponent(paymentIntentId)}/cancel`,
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  );
}
