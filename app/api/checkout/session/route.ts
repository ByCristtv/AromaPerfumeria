import { NextRequest, NextResponse } from "next/server";
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { OnvoApiError, createCheckoutSession } from "@/lib/onvo/client";
import { signOrderToken } from "@/lib/orders/tokens";
import { checkoutPayloadSchema } from "@/schemas/checkout";
import type { Database, Json } from "@/types/database";

/**
 * POST /api/checkout/session
 *
 * Server-side entrypoint for placing an order + creating a payment session.
 *
 * Flow:
 *   1. Read JSON body
 *   2. Re-validate with zod (never trust client-validated data)
 *   3. Call place_order RPC (creates order, decrements stock atomically)
 *   4. Sign HMAC token for the order URL
 *   5. Create Onvo checkout session with redirect/cancel URLs containing the token
 *   6. Stamp order with payment_provider + payment_reference
 *   7. Return { ..., payment_url } so the client redirects to Onvo
 *
 * Rollback contract:
 *   - place_order is atomic — failure means nothing was created.
 *   - If Onvo or the post-Onvo UPDATE fails, we call restore_variant_stock
 *     and mark the order denied so reserved stock is released.
 *   - Rollback uses the admin client (RLS bypass) since the order's status
 *     change isn't part of normal user-permitted operations.
 */
export async function POST(request: NextRequest) {
  // ────────── 1. Read JSON body ──────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(
      "invalid_json",
      "El cuerpo de la solicitud no es JSON válido.",
      400
    );
  }

  // ────────── 2. zod validate ──────────
  const parsed = checkoutPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "validation_failed",
        message: "Los datos del pedido son inválidos. Revisa los campos.",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  // ────────── 3. Call place_order RPC ──────────
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("place_order", {
    p_payload: parsed.data as unknown as Json,
  });

  if (error) return translateRpcError(error);
  if (!data) {
    console.error("[checkout] place_order returned no data", {
      payload: parsed.data,
    });
    return errorResponse(
      "internal_error",
      "No pudimos procesar tu pedido. Por favor intenta de nuevo.",
      500
    );
  }

  const result = data as unknown as PlaceOrderResult;

  // ────────── 4–6. Create Onvo session, with rollback on failure ──────────
  // From here on, any failure must restore stock and deny the order so the
  // reserved inventory doesn't leak.
  const admin = createAdminClient();

  let paymentUrl: string;
  let onvoSessionId: string;

  try {
    const token = signOrderToken(result.order_id);
    const appOrigin = resolveAppOrigin(request);

    const session = await createCheckoutSession({
      lineItems: [
        {
          quantity: 1,
          // Onvo expects smallest currency unit (céntimos for CRC).
          // place_order returns total as whole CRC (NUMERIC), so x100.
          unitAmount: Math.round(result.total * 100),
          currency: "CRC",
          description: `Pedido #${result.order_number} — Aroma Perfumería`,
        },
      ],
      redirectUrl: `${appOrigin}/orders/${result.order_id}?token=${token}`,
      cancelUrl: `${appOrigin}/orders/${result.order_id}?token=${token}&cancelled=1`,
      metadata: {
        orderId: result.order_id,
        orderNumber: String(result.order_number),
      },
    });

    paymentUrl = session.url;
    onvoSessionId = session.id;
  } catch (err) {
    await rollbackOrder(admin, result.order_id, "onvo_session_create_failed", err);
    return errorResponse(
      "payment_provider_error",
      "No pudimos conectar con el proveedor de pago. Tu pedido fue cancelado; por favor intenta de nuevo.",
      502,
      err instanceof OnvoApiError ? `Onvo ${err.status}` : undefined
    );
  }

  // Stamp the order with provider info so the webhook can correlate.
  const { error: updateErr } = await admin
    .from("orders")
    .update({
      payment_provider: "onvo",
      payment_reference: onvoSessionId,
    })
    .eq("id", result.order_id);

  if (updateErr) {
    await rollbackOrder(admin, result.order_id, "payment_ref_update_failed", updateErr);
    return errorResponse(
      "internal_error",
      "No pudimos finalizar tu pedido. Por favor intenta de nuevo.",
      500
    );
  }

  // ────────── 7. Success response ──────────
  return NextResponse.json({
    order_id: result.order_id,
    order_number: result.order_number,
    subtotal: result.subtotal,
    shipping_cost: result.shipping_cost,
    total: result.total,
    item_count: result.item_count,
    payment_url: paymentUrl,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Shape returned by the place_order RPC. */
interface PlaceOrderResult {
  order_id: string;
  order_number: number;
  subtotal: number;
  shipping_cost: number;
  total: number;
  item_count: number;
  shipping: {
    cost: number;
    zone_code: string;
    zone_name: string;
    free_shipping_applied: boolean;
    free_shipping_threshold: number | null;
  };
}

/**
 * Determine the public-facing origin to build redirect URLs.
 * Priority:
 *   1. NEXT_PUBLIC_APP_URL env var (explicit override — useful when behind
 *      a tunnel like ngrok and the request looks like localhost internally)
 *   2. request.nextUrl.origin (works on Vercel preview deploys + production)
 */
function resolveAppOrigin(request: NextRequest): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "");
  if (explicit) return explicit;
  return request.nextUrl.origin;
}

/**
 * Restore stock and mark order denied. Best-effort: if this itself fails we
 * log loudly but don't throw — the caller has already decided to fail the
 * request, and the operator has stock_movements + orders rows to fix manually.
 */
async function rollbackOrder(
  admin: SupabaseClient<Database>,
  orderId: string,
  reason: string,
  originalError: unknown
) {
  console.error(`[checkout] rollback (${reason})`, { orderId, originalError });

  const { error: restoreErr } = await admin.rpc("restore_variant_stock", {
    p_order_id: orderId,
  });
  if (restoreErr) {
    console.error("[checkout] restore_variant_stock FAILED during rollback", {
      orderId,
      restoreErr,
    });
  }

  const { error: denyErr } = await admin
    .from("orders")
    .update({
      order_status: "denied",
      payment_status: "failed",
      notes: `Rollback: ${reason}`,
    })
    .eq("id", orderId);
  if (denyErr) {
    console.error("[checkout] order denial UPDATE FAILED during rollback", {
      orderId,
      denyErr,
    });
  }
}

function translateRpcError(error: PostgrestError) {
  const msg = error.message ?? "";

  if (/^Insufficient stock/i.test(msg)) {
    return errorResponse(
      "stock_unavailable",
      "Lo sentimos, ya no hay stock suficiente para uno de los productos del carrito. Por favor actualiza tu carrito.",
      409,
      msg
    );
  }
  if (/no longer (exists|available)/i.test(msg)) {
    return errorResponse(
      "variant_unavailable",
      "Uno de los productos ya no está disponible. Por favor revisa tu carrito.",
      410,
      msg
    );
  }
  if (/^items /i.test(msg)) {
    return errorResponse(
      "empty_cart",
      "Tu carrito está vacío. Agrega productos para continuar.",
      400,
      msg
    );
  }
  if (/^(customer|shipping)\./i.test(msg)) {
    return errorResponse(
      "validation_failed",
      "Datos del pedido incompletos. Por favor revisa el formulario.",
      400,
      msg
    );
  }

  console.error("[checkout] unexpected RPC error", error);
  return errorResponse(
    "internal_error",
    "No pudimos procesar tu pedido. Por favor intenta de nuevo en unos momentos.",
    500,
    process.env.NODE_ENV === "development" ? msg : undefined
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
