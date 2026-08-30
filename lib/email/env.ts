/**
 * Email / notification environment configuration. Server-side only — none of
 * these are NEXT_PUBLIC_, so they never reach the browser bundle. Importing this
 * from a Client Component would read `undefined` for every value.
 *
 * ⚠ RESEND_API_KEY is a secret. It lives only here (server) and is never logged.
 */

export interface EmailEnv {
  /** Resend secret API key. Format: re_... */
  apiKey: string;
  /**
   * From address. MUST be on a domain verified in Resend, otherwise delivery to
   * arbitrary recipients is rejected. Falls back to Resend's shared sandbox
   * sender, which can ONLY deliver to the Resend account owner's own address —
   * fine for a first smoke test, not for production.
   */
  from: string;
  /** Where new-order notifications go — the store owner's inbox. */
  to: string;
}

/** Default recipient: the store owner. Overridable via ORDER_NOTIFICATIONS_TO. */
const DEFAULT_TO = "bysolano189@gmail.com";
const DEFAULT_FROM = "Krov <onboarding@resend.dev>";

let cached: EmailEnv | null = null;

/**
 * Load + validate email env once. Throws only when the API key is missing, so a
 * misconfigured deploy fails loudly the first time it tries to notify rather
 * than silently dropping emails. `from` and `to` have safe defaults.
 */
export function getEmailEnv(): EmailEnv {
  if (cached) return cached;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY env var is missing. Add it from your Resend dashboard " +
        "(https://resend.com/api-keys) to .env.local — order notifications need it."
    );
  }

  cached = {
    apiKey,
    from: process.env.EMAIL_FROM?.trim() || DEFAULT_FROM,
    to: process.env.ORDER_NOTIFICATIONS_TO?.trim() || DEFAULT_TO,
  };
  return cached;
}

/**
 * Base URL for links in emails (e.g. the admin order CTA). Reuses the existing
 * NEXT_PUBLIC_APP_URL. Trailing slash trimmed so callers can concatenate paths.
 */
export function getAppBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

/** Public storefront identity used on CUSTOMER-facing mail (not admin alerts). */
export interface StorefrontEmailIdentity {
  /** From header, e.g. "Krov Perfumería <ventas@krovperfumeriacr.com>". */
  from: string;
  /** Customer support inbox shown in the footer. */
  supportEmail: string;
}

const DEFAULT_CUSTOMER_FROM = "Krov Perfumería <ventas@krovperfumeriacr.com>";
const DEFAULT_SUPPORT_EMAIL = "ventas@krovperfumeriacr.com";

/**
 * Sender/support identity for customer confirmation emails. Separate from the
 * admin EMAIL_FROM so customers see the storefront address. Both fields have
 * production defaults and can be overridden via env.
 *
 * ⚠ The From domain (krovperfumeriacr.com) MUST be verified in Resend before
 * these emails deliver to real customer inboxes.
 */
export function getStorefrontEmailIdentity(): StorefrontEmailIdentity {
  return {
    from: process.env.CUSTOMER_EMAIL_FROM?.trim() || DEFAULT_CUSTOMER_FROM,
    supportEmail:
      process.env.SUPPORT_EMAIL?.trim() || DEFAULT_SUPPORT_EMAIL,
  };
}
