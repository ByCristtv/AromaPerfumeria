import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { verifyOrderToken } from "@/lib/orders/tokens";

/**
 * GET /api/orders/[id]/status
 *
 * Lightweight status probe used by the order page to poll for webhook-driven
 * payment confirmation without a full page reload. Returns only the few fields
 * the UI needs to decide whether to keep polling and what state to render.
 *
 * Authorization mirrors /orders/[id] and the retry route exactly:
 *   - RLS path: logged-in user owning the order (or admin)
 *   - Token path: ?token=<hmac> matching signOrderToken(orderId)
 *   - Neither → 404 (don't leak existence)
 *
 * Route Handlers are dynamic (uncached) by default, which is what we want:
 * every poll must reflect the live DB state.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = request.nextUrl.searchParams.get("token");

  // ──────── UUID format guard ────────
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return notFoundResponse();
  }

  // ──────── Authorize: RLS or token ────────
  const userClient = await createClient();
  const { data: probe } = await userClient
    .from("orders")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  let authorized = probe !== null;
  if (!authorized && verifyOrderToken(id, token)) {
    authorized = true;
  }
  if (!authorized) {
    return notFoundResponse();
  }

  // ──────── Fetch status via admin (RLS bypass, auth already proven) ────────
  const admin = createAdminClient();
  const { data: order, error } = await admin
    .from("orders")
    .select("payment_status, order_status, payment_provider")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[orders/status] fetch failed", { id, error });
    return NextResponse.json(
      { error: "internal_error", message: "No pudimos consultar el estado del pedido." },
      { status: 500 }
    );
  }
  if (!order) {
    return notFoundResponse();
  }

  return NextResponse.json({
    payment_status: order.payment_status,
    order_status: order.order_status,
    payment_provider: order.payment_provider,
  });
}

function notFoundResponse() {
  return NextResponse.json(
    { error: "not_found", message: "Pedido no encontrado." },
    { status: 404 }
  );
}
