import { NextRequest, NextResponse } from "next/server";
import { getOnvoEnv } from "@/lib/onvo/env";
import { verifyOnvoWebhookSecret } from "@/lib/onvo/verifyWebhook";
import type { OnvoWebhookEvent } from "@/lib/onvo/types";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/webhooks/onvo
 *
 * Receives payment-status callbacks from Onvo. This is the SOURCE OF TRUTH
 * for whether a payment succeeded — the customer's browser is not trusted.
 *
 * Response policy:
 *   - Only return non-2xx for AUTH failures (401). All other cases (unknown
 *     event types, missing orders, processing errors) return 200 with an
 *     internal log entry. Returning errors triggers Onvo retries indefinitely,
 *     which floods our logs without fixing anything actionable.
 *
 * Idempotency:
 *   - First action after auth + parse is INSERT INTO processed_webhooks
 *     (provider, event_id). ON CONFLICT → return 200 immediately ("already
 *     handled, all good"). This protects against Onvo's automatic retries.
 *
 * Security caveat:
 *   - Onvo's webhook authentication (as of 2026) is a static shared secret
 *     in the X-Webhook-Secret header rather than HMAC over the body. We
 *     compensate with order/amount sanity checks in handleSucceeded/Failed.
 *     See lib/onvo/verifyWebhook.ts for the full caveat.
 */
export async function POST(request: NextRequest) {

  console.log("========== WEBHOOK HIT ==========");

  // ────────── 1. Authenticate the webhook ──────────
  const env = getOnvoEnv();
  const headerSecret = request.headers.get("x-webhook-secret");

  console.log("HEADER SECRET:", headerSecret);
  console.log("ENV SECRET:", env.webhookSecret);

  if (!verifyOnvoWebhookSecret(headerSecret, env.webhookSecret)) {
    console.warn("[onvo-webhook] rejected: invalid or missing X-Webhook-Secret");
    return new NextResponse("Unauthorized", { status: 401 });
  }

  console.log("WEBHOOK AUTH PASSED");

  // ────────── 2. Parse the event ──────────
  let event: OnvoWebhookEvent;

  try {
    event = (await request.json()) as OnvoWebhookEvent;

    console.log("EVENT TYPE:", event?.type);
    console.log("EVENT ID:", event?.data?.id);
    console.log("ORDER ID:", event?.data?.metadata?.orderId);
    console.log("AMOUNT:", event?.data?.amount);

  } catch (err) {
    console.error("[onvo-webhook] body not JSON-parseable", err);
    return NextResponse.json({ received: true, ignored: "invalid_json" });
  }

  if (!event?.type || !event?.data?.id) {
    console.error("[onvo-webhook] event missing type or data.id", event);
    return NextResponse.json({ received: true, ignored: "malformed_event" });
  }

  // ────────── 3. Idempotency ──────────
  const admin = createAdminClient();

  console.log("TRYING INSERT INTO processed_webhooks");

  const { error: dedupErr } = await admin.from("processed_webhooks").insert({
    provider: "onvo",
    event_id: event.data.id,
  });

  if (dedupErr) {

    console.error("DEDUP ERROR:", dedupErr);

    if (dedupErr.code === "23505") {
      return NextResponse.json({ received: true, already_processed: true });
    }

    return NextResponse.json({ received: true, ignored: "dedup_db_error" });
  }

  console.log("WEBHOOK INSERTED SUCCESSFULLY");

  // ────────── 4. Route by event type ──────────
  try {

    console.log("ROUTING EVENT:", event.type);

    switch (event.type) {

      case "payment-intent.succeeded":
        console.log("CALLING handleSucceeded()");
        await handleSucceeded(admin, event);
        break;

      case "payment-intent.failed":
        console.log("CALLING handleFailed()");
        await handleFailed(admin, event);
        break;

      case "payment-intent.deferred":
        console.log("DEFERRED EVENT");
        break;

      case "checkout-session.succeeded":
        console.log("CHECKOUT SESSION SUCCEEDED");
        break;

      default:
        console.log("UNHANDLED EVENT TYPE:", event.type);
    }

  } catch (err) {

    console.error("[onvo-webhook] handler threw", {
      type: event.type,
      eventId: event.data.id,
      err,
    });
  }

  console.log("========== WEBHOOK END ==========");

  return NextResponse.json({ received: true });
}

// ─────────────────────────────────────────────────────────────────────────────
// Event handlers
// ─────────────────────────────────────────────────────────────────────────────

type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * Common lookup + guard logic for events that affect an order. Returns the
 * order row if checks pass, or null with a log entry if they don't.
 */
async function loadOrderForWebhook(
  admin: AdminClient,
  event: OnvoWebhookEvent
): Promise<{
  id: string;
  total: number;
  payment_status: string;
  order_status: string;
} | null> {
  const orderId = event.data.metadata?.orderId;
  if (!orderId) {
    console.warn("[onvo-webhook] event missing metadata.orderId", {
      type: event.type,
      eventId: event.data.id,
    });
    return null;
  }

  const { data: order, error } = await admin
    .from("orders")
    .select("id, total, payment_status, order_status")
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    console.error("[onvo-webhook] order lookup failed", { orderId, error });
    return null;
  }
  if (!order) {
    console.warn("[onvo-webhook] order not found", { orderId });
    return null;
  }

  return order;
}

async function handleSucceeded(
  admin: AdminClient,
  event: OnvoWebhookEvent
): Promise<void> {
  const order = await loadOrderForWebhook(admin, event);
  if (!order) return;

  // Don't reprocess if we already marked it paid via a previous webhook
  // (the unique constraint on processed_webhooks already protects us, but
  // belt-and-suspenders for the case where dedup row was deleted).
  if (order.payment_status === "paid") {
    console.info("[onvo-webhook] order already paid, skipping", {
      orderId: order.id,
    });
    return;
  }

  // Race guard: if the order was denied (by sweep or admin) AFTER the
  // customer's Onvo session was created but BEFORE this webhook arrived,
  // we'd otherwise mark a cancelled order as paid — charging the customer
  // for something whose stock has been restored to other shoppers.
  // Log loudly so an admin can issue a manual refund and reorder.
  if (order.order_status === "denied") {
    console.error(
      "[onvo-webhook] payment succeeded for ALREADY-DENIED order — MANUAL REFUND NEEDED",
      {
        orderId: order.id,
        intentId: event.data.id,
        amountCentimos: event.data.amount,
        metadata: event.data.metadata,
      }
    );
    return;
  }

  // Sanity-check amount. event.data.amount is in céntimos; order.total is CRC.
  const expectedAmount = Math.round(order.total * 100);
  if (typeof event.data.amount === "number" && event.data.amount !== expectedAmount) {
    console.error("[onvo-webhook] amount mismatch — NOT flipping to paid", {
      orderId: order.id,
      expectedCentimos: expectedAmount,
      receivedCentimos: event.data.amount,
    });
    return;
  }

  // order_status STAYS 'pending' per Phase 1 design — admin advances to
  // 'received' when they actually start fulfilling. payment_status alone
  // signals "money received".
  const { error: updateErr } = await admin
    .from("orders")
    .update({
      payment_status: "paid",
      paid_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  if (updateErr) {
    console.error("[onvo-webhook] failed to mark order paid", {
      orderId: order.id,
      updateErr,
    });
    return;
  }

  console.info("[onvo-webhook] order marked paid", { orderId: order.id });
}

async function handleFailed(
  admin: AdminClient,
  event: OnvoWebhookEvent
): Promise<void> {
  const order = await loadOrderForWebhook(admin, event);
  if (!order) return;

  // If already paid (rare race), don't restore stock — the customer paid.
  if (order.payment_status === "paid") {
    console.warn("[onvo-webhook] failed event for already-paid order, ignoring", {
      orderId: order.id,
    });
    return;
  }

  // Restore stock (idempotent — safe if a previous run already restored).
  const { error: restoreErr } = await admin.rpc("restore_variant_stock", {
    p_order_id: order.id,
  });
  if (restoreErr) {
    console.error("[onvo-webhook] restore_variant_stock failed", {
      orderId: order.id,
      restoreErr,
    });
    // Continue with the status update anyway — better to mark the order as
    // failed than leave it in pending limbo.
  }

  const { error: updateErr } = await admin
    .from("orders")
    .update({
      payment_status: "failed",
      order_status: "denied",
    })
    .eq("id", order.id);

  if (updateErr) {
    console.error("[onvo-webhook] failed to mark order denied", {
      orderId: order.id,
      updateErr,
    });
    return;
  }

  console.info("[onvo-webhook] order marked failed + stock restored", {
    orderId: order.id,
  });
}
