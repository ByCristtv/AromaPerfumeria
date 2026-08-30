import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getAppBaseUrl,
  getEmailEnv,
  getStorefrontEmailIdentity,
} from "@/lib/email/env";
import type { EmailMessage, EmailService } from "@/lib/email/types";
import { signOrderToken } from "@/lib/orders/tokens";
import { loadOrderNotificationData } from "./orderEmailData";
import { claimNotification, markFailed, markSent } from "./store";
import { renderCustomerOrderConfirmationEmail } from "./templates/customerOrderEmail";
import { renderOrderEmail } from "./templates/orderEmails";
import type { NotificationType, OrderNotificationData } from "./types";

type AdminClient = SupabaseClient<Database>;

/** Collaborators, injectable so tests run without a DB or Resend. */
export interface NotifierDeps {
  admin: AdminClient;
  emailService: EmailService;
  /** Recipient override for ADMIN alerts; defaults to the store-owner inbox. */
  to?: string;
}

/** What happened, for the caller's logs. Never a thrown error. */
export type NotifyResult =
  | { status: "sent"; id: string | null }
  | { status: "skipped"; reason: string }
  | { status: "failed"; reason: string };

/**
 * One notification's recipe: what type it is, whether it should fire for this
 * order (guard), and how to turn the order into a ready-to-send message.
 * dispatch() runs the recipe through the shared claim → load → send pipeline.
 */
interface NotificationSpec {
  type: NotificationType;
  /** Return a reason string to SKIP, or null to proceed. */
  guard: (data: OrderNotificationData) => string | null;
  /** Build the fully-rendered message. Pure given the order data. */
  buildMessage: (data: OrderNotificationData) => EmailMessage;
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin notifications (→ store owner)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * SINPE order created → email the OWNER immediately, even though payment is still
 * pending. Idempotent: safe to call more than once for the same order.
 */
export async function notifyNewSinpeOrder(
  orderId: string,
  deps?: Partial<NotifierDeps>
): Promise<NotifyResult> {
  return dispatch(
    orderId,
    {
      type: "sinpe_order_pending",
      guard: (data) =>
        data.paymentMethod === "sinpe"
          ? null
          : `not a SINPE order (method=${data.paymentMethod})`,
      buildMessage: (data) => adminMessage("sinpe_order_pending", data, deps),
    },
    deps
  );
}

/**
 * Payment confirmed → email the OWNER. Called from the Onvo webhook (card) and
 * from the admin "mark paid" action (SINPE / offline). Idempotent across both:
 * they share the (order_id, "order_payment_confirmed") ledger key, so whichever
 * fires first sends and the other is a no-op.
 */
export async function notifyOrderPaid(
  orderId: string,
  deps?: Partial<NotifierDeps>
): Promise<NotifyResult> {
  return dispatch(
    orderId,
    {
      type: "order_payment_confirmed",
      guard: (data) =>
        // Defense in depth: never announce "paid" for an order that isn't.
        data.paymentStatus === "paid"
          ? null
          : `order not paid (status=${data.paymentStatus})`,
      buildMessage: (data) => adminMessage("order_payment_confirmed", data, deps),
    },
    deps
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Customer notification (→ the customer)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Order confirmation sent to the CUSTOMER right after purchase. The template's
 * payment section is conditional on the method:
 *   • card  → "Confirmed / Paid"           (call this from the paid webhook)
 *   • SINPE → "Pending Payment Verification" (call this at order creation)
 *
 * One confirmation per order (unique ledger key), so retries/edits never double-
 * send. Skips silently when the order has no customer email (guest without one).
 */
export async function notifyCustomerOrderConfirmation(
  orderId: string,
  deps?: Partial<NotifierDeps>
): Promise<NotifyResult> {
  return dispatch(
    orderId,
    {
      type: "customer_order_confirmation",
      guard: (data) =>
        data.customer.email ? null : "order has no customer email",
      buildMessage: (data) => {
        const identity = getStorefrontEmailIdentity();
        const base = getAppBaseUrl();
        const email = renderCustomerOrderConfirmationEmail(data, {
          viewOrderUrl: `${base}/orders/${data.id}?token=${encodeURIComponent(
            signOrderToken(data.id)
          )}`,
          siteUrl: base,
          supportEmail: identity.supportEmail,
        });
        return {
          // guard guarantees email is non-null here.
          to: data.customer.email as string,
          from: identity.from,
          replyTo: identity.supportEmail,
          subject: email.subject,
          html: email.html,
          text: email.text,
        };
      },
    },
    deps
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pipeline
// ─────────────────────────────────────────────────────────────────────────────

/** Build an ADMIN alert message (owner inbox, default sender). */
function adminMessage(
  type: NotificationType,
  data: OrderNotificationData,
  deps: Partial<NotifierDeps> | undefined
): EmailMessage {
  const adminUrl = `${getAppBaseUrl()}/admin/orders/${data.id}`;
  const email = renderOrderEmail(type, data, adminUrl);
  return {
    to: deps?.to ?? getEmailEnv().to,
    subject: email.subject,
    html: email.html,
    text: email.text,
    // Let the owner reply straight to the customer when there's an email.
    replyTo: data.customer.email ?? undefined,
  };
}

/**
 * The shared pipeline. Wrapped so a failure at ANY step — claim, load, render,
 * send — is caught and reported, never thrown into the order/payment flow.
 *
 * Order of operations is deliberate:
 *   1. claim  — atomic reservation; a losing claim short-circuits with zero side
 *               effects, which is what makes duplicate webhooks/retries safe.
 *   2. load   — read the order fresh from the DB (source of truth).
 *   3. guard  — per-type precondition (right method / actually paid / has email).
 *   4. build  — render the message; pure given the order data.
 *   5. send   — provider call; result recorded either way.
 *
 * A guard failure AFTER claiming marks the row failed with the reason, so it
 * won't wedge in 'sending' forever and a corrected retry can re-claim it.
 */
async function dispatch(
  orderId: string,
  spec: NotificationSpec,
  deps: Partial<NotifierDeps> | undefined
): Promise<NotifyResult> {
  const admin = deps?.admin ?? createAdminClient();
  // Lazily import the Resend implementation only when not injected: it declares
  // `server-only`, which throws under the jsdom test environment. Tests always
  // pass a stub emailService, so this branch never runs there.
  const emailService =
    deps?.emailService ??
    (await import("@/lib/email/resendEmailService")).getEmailService();

  try {
    // 1. Claim.
    const rowId = await claimNotification(admin, orderId, spec.type);
    if (!rowId) {
      return { status: "skipped", reason: "already sent or in progress" };
    }

    // 2. Load.
    const data = await loadOrderNotificationData(admin, orderId);
    if (!data) {
      await markFailed(admin, rowId, "order not found at send time");
      return { status: "failed", reason: "order not found" };
    }

    // 3. Guard.
    const guardReason = spec.guard(data);
    if (guardReason) {
      await markFailed(admin, rowId, `precondition not met: ${guardReason}`);
      return { status: "skipped", reason: guardReason };
    }

    // 4. Build + 5. Send.
    const result = await emailService.send(spec.buildMessage(data));

    if (!result.ok) {
      await markFailed(admin, rowId, result.error);
      console.error("[notifications] send failed", {
        orderId,
        type: spec.type,
        error: result.error,
      });
      return { status: "failed", reason: result.error };
    }

    await markSent(admin, rowId, result.id);
    console.info("[notifications] sent", {
      orderId,
      type: spec.type,
      messageId: result.id,
    });
    return { status: "sent", id: result.id };
  } catch (err) {
    // Absolute backstop: notifications must never break checkout / webhooks.
    const reason = err instanceof Error ? err.message : "unknown error";
    console.error("[notifications] dispatch threw", {
      orderId,
      type: spec.type,
      reason,
    });
    return { status: "failed", reason };
  }
}
