"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { wholesaleApplicationSchema } from "@/schemas/wholesale";
import type { ActionResult } from "@/types/action";
import type { WholesaleApplicationInput } from "@/types/wholesale";

/**
 * Submit (or re-submit) a wholesale account application.
 *
 * Trust boundary: the form already validated on the client, but this action
 * re-validates and enforces every rule server-side (auth, role gate, dedupe).
 * The insert/update runs through the request's RLS client, so the
 * wholesale_profiles owner policies are the final gate — a user can only ever
 * write their OWN row, and only ever in the `pending` state.
 */
export async function applyForWholesaleAction(
  input: WholesaleApplicationInput
): Promise<ActionResult> {
  const parsed = wholesaleApplicationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Datos de la solicitud inválidos.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      message: "Debes iniciar sesión para solicitar una cuenta mayorista.",
    };
  }

  // Role gate: only standard customers may apply.
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileErr || !profile) {
    return { ok: false, message: "No pudimos cargar tu perfil. Intenta de nuevo." };
  }
  if (profile.role === "admin") {
    return {
      ok: false,
      message: "Las cuentas de administrador no pueden solicitar acceso mayorista.",
    };
  }
  if (profile.role === "wholesale") {
    return { ok: false, message: "Tu cuenta ya tiene acceso mayorista." };
  }

  const values = parsed.data;
  const website =
    values.website && values.website.trim() !== "" ? values.website.trim() : null;

  // Dedupe: one application per user. Re-applying is allowed only after a
  // rejection (the RLS update policy permits setting status back to 'pending').
  const { data: existing } = await supabase
    .from("wholesale_profiles")
    .select("application_status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    if (existing.application_status === "pending") {
      return { ok: false, message: "Ya tienes una solicitud pendiente de revisión." };
    }
    if (existing.application_status === "approved") {
      return { ok: false, message: "Tu cuenta mayorista ya fue aprobada." };
    }

    // Rejected → allow a fresh submission.
    const { error } = await supabase
      .from("wholesale_profiles")
      .update({
        company_name: values.company_name,
        tax_id: values.tax_id,
        business_activity: values.business_activity,
        website,
        application_status: "pending",
      })
      .eq("user_id", user.id);

    if (error) {
      console.error("[wholesale] re-apply update failed", error);
      return { ok: false, message: "No pudimos reenviar tu solicitud. Intenta de nuevo." };
    }

    revalidatePath("/profile");
    return { ok: true, message: "Solicitud reenviada. La revisaremos pronto." };
  }

  const { error } = await supabase.from("wholesale_profiles").insert({
    user_id: user.id,
    company_name: values.company_name,
    tax_id: values.tax_id,
    business_activity: values.business_activity,
    website,
    application_status: "pending",
  });

  if (error) {
    console.error("[wholesale] application insert failed", error);
    return { ok: false, message: "No pudimos enviar tu solicitud. Intenta de nuevo." };
  }

  revalidatePath("/profile");
  return {
    ok: true,
    message: "¡Solicitud enviada! Te avisaremos cuando la revisemos.",
  };
}
