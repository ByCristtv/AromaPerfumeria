"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { rankingSettingsSchema, type RankingSettingsFormValues } from "@/schemas/ranking";
import type { ActionResult } from "@/types/action";

/** Postgres error codes we can translate into something a customer can act on. */
const PG_UNIQUE_VIOLATION = "23505";
const PG_CHECK_VIOLATION = "23514";

export interface RankingSettingsData {
  username: string | null;
  show_in_ranking: boolean;
}

/**
 * Save the caller's public username and leaderboard opt-in.
 *
 * Trust boundary: the card validates as the user types, but this action
 * re-validates the whole payload and — critically — derives the row it writes
 * from `auth.getUser()`, never from the input. There is no user id in the
 * payload to tamper with, and the UPDATE is additionally scoped by the
 * "Users can update own profile" RLS policy, so a caller cannot reach another
 * profile even by forging a request.
 *
 * The one state this must never produce is "opted in with no username". Three
 * things prevent it, in order: the schema's cross-field refine, the auto-disable
 * below, and `profiles_ranking_requires_username` in the database — which is the
 * only one of the three a hand-rolled REST call still has to satisfy.
 */
export async function updateRankingSettingsAction(
  input: RankingSettingsFormValues
): Promise<ActionResult<RankingSettingsData>> {
  const parsed = rankingSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Datos inválidos.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      message: "Debes iniciar sesión para cambiar tu perfil.",
    };
  }

  const { username } = parsed.data;

  // Clearing the username while opted in would otherwise trip the CHECK and
  // fail the whole save. Resolving it to the safe state — private — keeps the
  // user's intent (remove my public name) working in one step, and means the
  // invalid combination is never even attempted.
  const show_in_ranking = username === null ? false : parsed.data.show_in_ranking;

  const { error } = await supabase
    .from("profiles")
    .update({ username, show_in_ranking })
    .eq("id", user.id);

  if (error) {
    if (error.code === PG_UNIQUE_VIOLATION) {
      return {
        ok: false,
        message: "Ese nombre de usuario ya está en uso. Prueba con otro.",
      };
    }
    if (error.code === PG_CHECK_VIOLATION) {
      return {
        ok: false,
        message: "El nombre de usuario no cumple el formato permitido.",
      };
    }

    console.error("[ranking] settings update failed", error);
    return {
      ok: false,
      message: "No pudimos guardar tus preferencias. Intenta de nuevo.",
    };
  }

  // The leaderboard is cached (see app/ranking/page.tsx) — an opt-in or a
  // rename should show up there without waiting out the revalidate window.
  revalidatePath("/ranking");
  revalidatePath("/profile");

  // Echoed back so the client can render the state the DATABASE now holds,
  // including the auto-disable above, instead of assuming the input stuck.
  return {
    ok: true,
    message:
      username === null
        ? "Nombre de usuario eliminado. Ya no apareces en el ranking."
        : show_in_ranking
          ? "Listo. Apareces en el ranking público."
          : "Preferencias guardadas.",
    data: { username, show_in_ranking },
  };
}
