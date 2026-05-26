import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { OnvoApiError, createCheckoutSession } from "@/lib/onvo/client";
import { signOrderToken, verifyOrderToken } from "@/lib/orders/tokens";

/**
 * POST /api/checkout/retry/[orderId]
 *
 * Generates a fresh Onvo checkout session for an existing pending order.
 *
 * Used by:
 *   - "Reintentar pago" button on /orders/[id] (shown when ?cancelled=1)
 *   - Future: support tooling for customers stuck mid-payment
 *
 * Authorization:
 *   - RLS path: logged-in user owning the order
 *   - Token path: ?token=<hmac> matching signOrderToken(orderId)
 *   - Neither → 404 (don't leak existence)
 *
 * Guards:
 *   - Order is pending (payment_status='pending', order_status='pending')
 *   - Provider is onvo (forward-compat)
 *   - Age < 25 min — sweep cancels at 30 min; 5-min buffer prevents the race
 *     where a retry session is paid AFTER sweep has already denied the order.
 *     The webhook handler also guards against this case in defense-in-depth.
 *
 * The order_items, totals, address are all reused — only the Onvo
 * payment_reference is replaced with the new session id.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  const token = request.nextUrl.searchParams.get("token");

  // ──────── UUID format guard ────────
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId)) {
    return notFoundResponse();
  }

  // ──────── Authorize: RLS or token ────────
  const userClient = await createClient();
  const { data: probe } = await userClient
    .from("orders")
    .select("id")
    .eq("id", orderId)
    .maybeSingle();

  let authorized = probe !== null;
  if (!authorized && verifyOrderToken(orderId, token)) {
    authorized = true;
  }
  if (!authorized) {
    return notFoundResponse();
  }

  // ──────── Fetch order via admin (RLS bypass, we've already proved auth) ────────
  const admin = createAdminClient();
  const { data: order, error } = await admin
    .from("orders")
    .select(
      "id, order_number, total, order_status, payment_status, payment_provider, created_at"
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    console.error("[retry] order fetch failed", { orderId, error });
    return errorResponse("internal_error", "No pudimos cargar el pedido.", 500);
  }
  if (!order) {
    return notFoundResponse();
  }

  // ──────── State guards ────────
  if (order.payment_status === "paid") {
    return errorResponse(
      "already_paid",
      "Este pedido ya fue pagado. Revisa tu correo para los detalles.",
      409
    );
  }
  if (order.order_status === "denied") {
    return errorResponse(
      "order_denied",
      "Este pedido fue cancelado y no puede ser pagado. Por favor crea uno nuevo.",
      410
    );
  }
  if (order.payment_provider !== "onvo") {
    return errorResponse(
      "unsupported_provider",
      "Este pedido no admite reintentos automáticos. Contáctanos por WhatsApp.",
      400
    );
  }

  // ──────── Age check ────────
  const ageMinutes =
    (Date.now() - new Date(order.created_at).getTime()) / 60_000;
  if (ageMinutes > 25) {
    return errorResponse(
      "order_expired",
      "Este pedido es demasiado antiguo para reintentar el pago. Por favor contáctanos por WhatsApp para completarlo.",
      410
    );
  }

  // ──────── Create new Onvo session ────────
  let sessionId: string;
  let paymentUrl: string;
  try {
    const freshToken = signOrderToken(orderId);
    const appOrigin = resolveAppOrigin(request);

    const session = await createCheckoutSession({
      lineItems: [
        {
          quantity: 1,
          unitAmount: Math.round(order.total * 100),
          currency: "CRC",
          description: `Pedido #${order.order_number} — Aroma Perfumería (reintento)`,
        },
      ],
      redirectUrl: `${appOrigin}/orders/${orderId}?token=${freshToken}`,
      cancelUrl: `${appOrigin}/orders/${orderId}?token=${freshToken}&cancelled=1`,
      metadata: {
        orderId,
        orderNumber: String(order.order_number),
        retry: "1",
      },
    });

    sessionId = session.id;
    paymentUrl = session.url;
  } catch (err) {
    console.error("[retry] Onvo session creation failed", { orderId, err });
    return errorResponse(
      "payment_provider_error",
      "No pudimos conectar con el proveedor de pago. Intenta de nuevo en unos momentos.",
      502,
      err instanceof OnvoApiError ? `Onvo ${err.status}` : undefined
    );
  }

  // ──────── Update payment_reference ────────
  // No rollback needed if this fails — order is already in pending, stock
  // already reserved. The new Onvo session exists either way; worst case the
  // user pays a session whose ID we don't have stored, and the webhook handler
  // can still match via metadata.orderId (which is the actual lookup key).
  const { error: updateErr } = await admin
    .from("orders")
    .update({ payment_reference: sessionId })
    .eq("id", orderId);

  if (updateErr) {
    console.warn(
      "[retry] failed to update payment_reference — webhook will still match via metadata.orderId",
      { orderId, sessionId, updateErr }
    );
    // Don't fail the request — the redirect can still work; webhook uses metadata.
  }

  return NextResponse.json({
    order_id: orderId,
    payment_url: paymentUrl,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function resolveAppOrigin(request: NextRequest): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "");
  if (explicit) return explicit;
  return request.nextUrl.origin;
}

function notFoundResponse() {
  return NextResponse.json(
    { error: "not_found", message: "Pedido no encontrado." },
    { status: 404 }
  );
}

function errorResponse(
  code: string,
  message: string,
  status: number,
  hint?: string
) {
  return NextResponse.json(
    { error: code, message, ...(hint && { hint }) },
    { status }
  );
}
