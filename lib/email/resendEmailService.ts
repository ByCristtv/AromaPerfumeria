import "server-only";
import { Resend } from "resend";
import { getEmailEnv } from "./env";
import type { EmailMessage, EmailSendResult, EmailService } from "./types";

/**
 * The ONLY module in the app that talks to Resend. Everything else depends on
 * the EmailService interface, so `resend.emails.send()` never leaks into order
 * or payment code (Single Responsibility + Dependency Inversion).
 *
 * `import "server-only"` is a hard guard: this pulls in the secret API key, so
 * importing it from a Client Component must fail the build, not ship the key.
 */
export class ResendEmailService implements EmailService {
  private client: Resend | null = null;

  /** Lazily construct the client so importing this file never reads env eagerly. */
  private getClient(): Resend {
    if (!this.client) {
      this.client = new Resend(getEmailEnv().apiKey);
    }
    return this.client;
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    // Per-message From wins; otherwise the configured default (admin alerts).
    const from = message.from ?? getEmailEnv().from;

    try {
      const { data, error } = await this.getClient().emails.send({
        from,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
        ...(message.replyTo ? { replyTo: message.replyTo } : {}),
      });

      if (error) {
        // Resend returns a structured error rather than throwing. Surface the
        // message (safe — no secrets), never the payload.
        return { ok: false, error: error.message ?? "resend_unknown_error" };
      }
      return { ok: true, id: data?.id ?? null };
    } catch (err) {
      // Network / unexpected SDK failure. Normalize to the same shape so callers
      // have exactly one failure path.
      return {
        ok: false,
        error: err instanceof Error ? err.message : "resend_send_threw",
      };
    }
  }
}

/**
 * Shared singleton. The service is stateless beyond its cached client, so one
 * instance per server process is correct and avoids reconnecting per email.
 */
let instance: EmailService | null = null;

export function getEmailService(): EmailService {
  if (!instance) instance = new ResendEmailService();
  return instance;
}
