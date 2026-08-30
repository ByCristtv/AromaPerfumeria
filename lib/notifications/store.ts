import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { NotificationType } from "./types";

type AdminClient = SupabaseClient<Database>;

/**
 * Thin data-access wrapper around the order_notifications idempotency ledger.
 *
 * The claim_order_notification / finalize_order_notification RPCs are typed only
 * after `npm run update-types` runs against the DB post-migration. Until then the
 * generated Database type doesn't know them, so we cast narrowly HERE and nowhere
 * else — the same pattern features/admin/getProductsAdminPage.ts uses for its
 * pending RPC. One escape hatch, clearly labeled.
 */

type ClaimRpc = (
  fn: "claim_order_notification",
  args: { p_order_id: string; p_type: NotificationType }
) => PromiseLike<{ data: string | null; error: { message: string } | null }>;

type FinalizeRpc = (
  fn: "finalize_order_notification",
  args: {
    p_id: string;
    p_status: "sent" | "failed";
    p_provider_message_id?: string | null;
    p_error_message?: string | null;
  }
) => PromiseLike<{ data: unknown; error: { message: string } | null }>;

/**
 * Atomically reserve the right to send `type` for `orderId`.
 *
 * Returns the ledger row id when THIS caller won the claim, or null when the
 * notification was already sent or is being sent by another worker. A null
 * return is the signal to send nothing — the core of the idempotency guarantee.
 */
export async function claimNotification(
  admin: AdminClient,
  orderId: string,
  type: NotificationType
): Promise<string | null> {
  const rpc = admin.rpc.bind(admin) as unknown as ClaimRpc;
  const { data, error } = await rpc("claim_order_notification", {
    p_order_id: orderId,
    p_type: type,
  });

  if (error) {
    console.error("[notifications] claim failed", { orderId, type, error });
    return null;
  }
  return data ?? null;
}

/** Record a successful send against a previously claimed ledger row. */
export async function markSent(
  admin: AdminClient,
  rowId: string,
  providerMessageId: string | null
): Promise<void> {
  await finalize(admin, rowId, "sent", providerMessageId, null);
}

/** Record a failed send; the row stays eligible for a later retry. */
export async function markFailed(
  admin: AdminClient,
  rowId: string,
  errorMessage: string
): Promise<void> {
  await finalize(admin, rowId, "failed", null, errorMessage.slice(0, 1000));
}

async function finalize(
  admin: AdminClient,
  rowId: string,
  status: "sent" | "failed",
  providerMessageId: string | null,
  errorMessage: string | null
): Promise<void> {
  const rpc = admin.rpc.bind(admin) as unknown as FinalizeRpc;
  const { error } = await rpc("finalize_order_notification", {
    p_id: rowId,
    p_status: status,
    p_provider_message_id: providerMessageId,
    p_error_message: errorMessage,
  });

  if (error) {
    // Best-effort: the email already went out (or already failed). A failure to
    // WRITE the outcome must not throw into the order/payment flow.
    console.error("[notifications] finalize failed", { rowId, status, error });
  }
}
