/**
 * Provider-agnostic email contracts.
 *
 * The rest of the app depends on THIS interface, never on Resend directly
 * (Dependency Inversion). Swapping providers — or faking one in tests — means a
 * new EmailService implementation and nothing else.
 */

/** A fully-rendered message, ready to hand to any provider. */
export interface EmailMessage {
  to: string | string[];
  subject: string;
  html: string;
  /** Plaintext fallback for clients that don't render HTML. */
  text: string;
  /**
   * Optional From override. Defaults to the configured EMAIL_FROM (admin alerts).
   * Customer-facing mail overrides it with the storefront sender
   * (ventas@krovperfumeriacr.com) so replies and branding are correct.
   */
  from?: string;
  /** Optional Reply-To. */
  replyTo?: string;
}

/** Outcome of a delivery attempt. Never throws for provider-side failures. */
export type EmailSendResult =
  | { ok: true; id: string | null }
  | { ok: false; error: string };

/**
 * The one capability the notification layer needs: send a rendered message.
 *
 * Deliberately minimal (ISP) — no templating, no batching, no scheduling. Those
 * are someone else's job. Implementations MUST NOT throw for a provider error;
 * they return `{ ok: false }` so callers can record the failure without a
 * try/catch at every call site.
 */
export interface EmailService {
  send(message: EmailMessage): Promise<EmailSendResult>;
}
