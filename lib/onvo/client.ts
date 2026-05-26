import { getOnvoEnv } from "./env";
import type {
  OnvoCheckoutSession,
  OnvoCreateCheckoutSessionInput,
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
