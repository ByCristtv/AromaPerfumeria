import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * HMAC-signed URL tokens for guest order viewing.
 *
 * Use case:
 *   - Guest places an order → /api/checkout/session signs their order_id with
 *     this helper and embeds the token in the Onvo redirectUrl:
 *       /orders/{id}?token={hmac}
 *   - On return, /orders/[id]/page.tsx calls verifyOrderToken to decide
 *     whether to render the order without an auth-cookie match.
 *
 * Design:
 *   - Deterministic: signing the same order_id always produces the same token.
 *     This means a token sent in a confirmation email keeps working forever
 *     until ORDER_TOKEN_SECRET rotates. Acceptable for v1 (order links are
 *     personal). If you ever need revocation, replace this with a `view_token`
 *     column on orders + random uuid generation.
 *   - Stateless: no DB writes.
 *   - URL-safe: base64url encoding, no '+' '/' '=' chars.
 *   - Constant-time verification via timingSafeEqual.
 *
 * Security caveat:
 *   - Anyone who has both the order_id (in the URL) and the secret can forge a
 *     token. Protect ORDER_TOKEN_SECRET like an API key. NEVER commit, NEVER
 *     log, NEVER ship to the client bundle (no NEXT_PUBLIC_ prefix).
 *   - URL leaks (referrer, browser history shared, server access logs) expose
 *     the token. Set a Referrer-Policy on /orders pages to mitigate.
 */

function getSecret(): string {
  const secret = process.env.ORDER_TOKEN_SECRET;
  if (!secret) {
    throw new Error(
      "ORDER_TOKEN_SECRET env var is missing. Generate one with `openssl rand -hex 32` and add to .env.local."
    );
  }
  if (secret.length < 32) {
    throw new Error(
      "ORDER_TOKEN_SECRET must be at least 32 chars. Generate one with `openssl rand -hex 32`."
    );
  }
  return secret;
}

/** Base64url-encode (RFC 4648 §5) — URL-safe, no padding. */
function base64url(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Generate the URL-safe HMAC token for an order id.
 * Returns ~43 chars (32 bytes of SHA-256 → base64url).
 */
export function signOrderToken(orderId: string): string {
  const hmac = createHmac("sha256", getSecret());
  hmac.update(orderId);
  return base64url(hmac.digest());
}

/**
 * Constant-time verification of a token against an order id.
 * Returns true iff the token was signed with the same secret for this exact id.
 */
export function verifyOrderToken(
  orderId: string,
  token: string | null | undefined
): boolean {
  if (!token) return false;

  const expected = signOrderToken(orderId);

  const a = Buffer.from(token, "utf8");
  const b = Buffer.from(expected, "utf8");

  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
