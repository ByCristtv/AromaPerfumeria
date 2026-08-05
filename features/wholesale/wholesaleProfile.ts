import { supabase } from "@/lib/supabase/client";
import {
  toApplicationStatus,
  type WholesaleEligibility,
  type WholesaleProfileRow,
} from "@/types/wholesale";

/**
 * Browser-side reads for a user's wholesale application. RLS restricts these to
 * the caller's own row (see the wholesale_profiles policies).
 */

/** The current user's wholesale application, or null if they never applied. */
export async function getWholesaleProfile(
  userId: string
): Promise<WholesaleProfileRow | null> {
  const { data, error } = await supabase
    .from("wholesale_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("getWholesaleProfile failed:", error.message);
    return null;
  }
  return data;
}

/**
 * Resolve whether a user may receive wholesale pricing. Both gates are required:
 * the `wholesale` role AND an `approved` application. Reads profile role and the
 * application status in parallel.
 */
export async function getWholesaleEligibility(
  userId: string
): Promise<WholesaleEligibility> {
  const [profileRes, wholesaleRes] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", userId).single(),
    supabase
      .from("wholesale_profiles")
      .select("application_status")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const role = profileRes.data?.role ?? null;
  const status = toApplicationStatus(wholesaleRes.data?.application_status);

  return {
    isApproved: role === "wholesale" && status === "approved",
    role,
    status,
  };
}
