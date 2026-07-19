/**
 * Onvo environment configuration. Server-side only — env vars do NOT have a
 * NEXT_PUBLIC_ prefix, so Next.js will replace them with "" in the client
 * bundle. Importing this file from a Client Component would throw at runtime.
 */

interface OnvoEnv {
  /** Secret API key from Onvo dashboard. Format: onvo_test_secret_key_... or onvo_live_secret_key_... */
  apiKey: string;
  /**
   * Publishable key from Onvo dashboard. Format: onvo_test_publishable_key_... or
   * onvo_live_publishable_key_... Safe to expose to the browser — the embedded Web SDK
   * needs it to render the payment element. We deliberately DON'T use a NEXT_PUBLIC_
   * prefix: the value is handed to the client via the /api/checkout/session response,
   * keeping all Onvo config server-side and read in one place.
   */
  publicKey: string;
  /** Webhook signature/secret from Onvo dashboard. Format: webhook_secret_... */
  webhookSecret: string;
  /** API base URL. Default: https://api.onvopay.com (same for test + live; the key prefix decides env). */
  apiUrl: string;
}

let cached: OnvoEnv | null = null;

/**
 * Load + validate Onvo env vars once. Throws on first call with a clear
 * message if anything is missing — surfaces config errors at startup rather
 * than the first time a customer tries to check out.
 */
export function getOnvoEnv(): OnvoEnv {
  if (cached) return cached;

  const apiKey = process.env.ONVO_API_KEY;
  const publicKey = process.env.ONVO_PUBLIC_KEY;
  const webhookSecret = process.env.ONVO_WEBHOOK_SECRET;
  const apiUrl = process.env.ONVO_API_URL ?? "https://api.onvopay.com";

  if (!apiKey) {
    throw new Error(
      "ONVO_API_KEY env var is missing. Add it from your Onvo dashboard to .env.local."
    );
  }
  if (!publicKey) {
    throw new Error(
      "ONVO_PUBLIC_KEY env var is missing. Add your publishable key (onvo_*_publishable_key_...) from your Onvo dashboard to .env.local — the embedded checkout SDK needs it."
    );
  }
  if (!webhookSecret) {
    throw new Error(
      "ONVO_WEBHOOK_SECRET env var is missing. Add it from your Onvo dashboard to .env.local."
    );
  }

  cached = { apiKey, publicKey, webhookSecret, apiUrl };
  return cached;
}
