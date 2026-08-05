"use server";

import { revalidatePath } from "next/cache";
import type { PostgrestError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import {
  reviewWholesaleApplication,
  type WholesaleDecision,
} from "@/lib/wholesale/reviewRpc";
import type { ActionResult } from "@/types/action";

/**
 * Approve or reject a wholesale application.
 *
 * Three layers of defense (same as the admin order actions):
 *   1. proxy.ts keeps non-admins off /admin/* before the page renders.
 *   2. review_wholesale_application() runs is_admin() internally (it's the real
 *      gate — a server action can be POSTed directly, bypassing the proxy).
 *   3. This wrapper translates RPC errors → friendly Spanish messages.
 *
 * On approval the RPC also promotes profiles.role → 'wholesale' atomically.
 */
export async function reviewWholesaleApplicationAction(
  userId: string,
  decision: WholesaleDecision
): Promise<ActionResult<{ user_id: string; application_status: string }>> {
  if (!isUuid(userId)) {
    return { ok: false, message: "ID de usuario inválido." };
  }
  if (decision !== "approved" && decision !== "rejected") {
    return { ok: false, message: "Decisión inválida." };
  }

  const supabase = await createClient();
  const { data, error } = await reviewWholesaleApplication(
    supabase,
    userId,
    decision
  );

  if (error) {
    return rpcError(error);
  }

  revalidatePath("/admin/wholesale");

  return {
    ok: true,
    message:
      decision === "approved"
        ? "Solicitud aprobada. La cuenta ahora es mayorista."
        : "Solicitud rechazada.",
    data: data ?? undefined,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

function rpcError(
  error: PostgrestError
): ActionResult<{ user_id: string; application_status: string }> {
  const msg = error.message ?? "";

  if (/Insufficient privilege/i.test(msg)) {
    return { ok: false, message: "No tienes permiso para realizar esta acción." };
  }
  // Check the "RPC missing" case BEFORE the generic "does not exist" below,
  // which would otherwise shadow it.
  if (/function .*review_wholesale_application.* does not exist/i.test(msg)) {
    return {
      ok: false,
      message:
        "Falta aplicar la migración de mayoristas (review_wholesale_application). Ejecútala en Supabase.",
    };
  }
  if (/does not exist/i.test(msg)) {
    return { ok: false, message: "La solicitud ya no existe." };
  }
  if (/Invalid decision/i.test(msg)) {
    return { ok: false, message: "Decisión inválida." };
  }

  console.error("[admin/wholesale/actions] unexpected RPC error", error);
  return { ok: false, message: "No pudimos procesar la solicitud." };
}
