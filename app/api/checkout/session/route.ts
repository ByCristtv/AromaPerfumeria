import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { submitCheckout } from "@/lib/checkout/checkoutService";
import { CheckoutError } from "@/lib/checkout/errors";
import { checkoutPayloadSchema } from "@/schemas/checkout";
import {
  notifyCustomerOrderConfirmation,
  notifyNewSinpeOrder,
} from "@/lib/notifications/orderNotifier";

/**
 * POST /api/checkout/session
 *
 * The checkout entrypoint, for both the first submit and every edit after it.
 *
 * This handler is a transport adapter and nothing more: read → validate →
 * delegate → map errors. All business logic lives in lib/checkout (see
 * checkoutService.submitCheckout), so the same flow could be driven from a Server
 * Action or a script without touching this file.
 *
 * Create vs update is decided by the service from the optional `session` field —
 * the client echoes back { order_id, order_token } once it has a pending order,
 * and the service re-verifies the HMAC before touching anything. This is what
 * makes editing shipping data update the SAME order instead of minting a new one
 * (and reserving stock) on every submit.
 */
export async function POST(request: NextRequest) {
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

  // Re-validate server-side: this is a public endpoint and anyone can curl it.
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

  try {
    const admin = createAdminClient();
    const result = await submitCheckout(
      { supabase: await createClient(), admin },
      parsed.data
    );

    // SINPE orders are unpaid but must notify NOW: the owner (watch for the
    // transfer) and the customer (a "payment pending" confirmation). Card orders
    // are intentionally silent here — both their notifications fire only once the
    // Onvo webhook confirms payment. All of these are idempotent, so a customer
    // editing their SINPE order re-hits this without sending duplicate emails.
    if (result.payment_method === "sinpe") {
      await Promise.all([
        notifyNewSinpeOrder(result.order_id, { admin }),
        notifyCustomerOrderConfirmation(result.order_id, { admin }),
      ]);
    }

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof CheckoutError) {
      return errorResponse(err.code, err.message, err.status, err.hint);
    }
    console.error("[checkout] unhandled error", err);
    return errorResponse(
      "internal_error",
      "No pudimos procesar tu pedido. Por favor intenta de nuevo.",
      500
    );
  }
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
