/**
 * SINPE Móvil configuration. Server-side only — no NEXT_PUBLIC_ prefix, so these
 * never reach the client bundle. The instructions page is a Server Component and
 * reads them directly.
 *
 * Mirrors lib/onvo/env.ts: validate once, cache, and fail loudly at first use
 * rather than rendering a payment instructions page with a blank phone number —
 * a customer transferring money to nowhere is far worse than an error page.
 */

interface SinpeEnv {
  /** Destination number for the transfer, e.g. "8888-8888". Displayed verbatim. */
  phone: string;
  /** Account holder name shown so the customer can confirm the destination. */
  accountHolder: string;
}

let cached: SinpeEnv | null = null;

export function getSinpeEnv(): SinpeEnv {
  if (cached) return cached;

  const phone = process.env.SINPE_PHONE;
  const accountHolder = process.env.SINPE_ACCOUNT_HOLDER;

  if (!phone) {
    throw new Error(
      "SINPE_PHONE env var is missing. Add the SINPE Móvil destination number to .env.local — the payment instructions page cannot render without it."
    );
  }
  if (!accountHolder) {
    throw new Error(
      "SINPE_ACCOUNT_HOLDER env var is missing. Add the account holder's name to .env.local so customers can confirm the transfer destination."
    );
  }

  cached = { phone, accountHolder };
  return cached;
}
