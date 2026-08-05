import { createClient } from "@/lib/supabase/server";

/** One row of the admin wholesale-review queue. */
export interface WholesaleApplicationAdminRow {
  user_id: string;
  company_name: string;
  tax_id: string;
  business_activity: string | null;
  website: string | null;
  application_status: string;
  created_at: string;
  updated_at: string;
  applicant_name: string | null;
  applicant_phone: string | null;
}

/** Shape of the embedded profile join (cast target). */
interface RawApplicationRow {
  user_id: string;
  company_name: string;
  tax_id: string;
  business_activity: string | null;
  website: string | null;
  application_status: string;
  created_at: string;
  updated_at: string;
  profiles: { full_name: string | null; phone: string | null } | null;
}

// Pending first (it's a work queue), then most recent.
const STATUS_ORDER: Record<string, number> = {
  pending: 0,
  rejected: 1,
  approved: 2,
};

/**
 * All wholesale applications for the admin review queue. Runs on the
 * request-bound client — RLS ("Admins can view all wholesale applications")
 * scopes it to admins, and proxy.ts already kept non-admins off /admin/*.
 */
export async function getWholesaleApplications(): Promise<
  WholesaleApplicationAdminRow[]
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("wholesale_profiles")
    .select(
      `
      user_id, company_name, tax_id, business_activity, website,
      application_status, created_at, updated_at,
      profiles:profiles!wholesale_profiles_user_id_fkey ( full_name, phone )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getWholesaleApplications failed:", error.message);
    return [];
  }

  const rows = (data as unknown as RawApplicationRow[]) ?? [];

  return rows
    .map((r) => ({
      user_id: r.user_id,
      company_name: r.company_name,
      tax_id: r.tax_id,
      business_activity: r.business_activity,
      website: r.website,
      application_status: r.application_status,
      created_at: r.created_at,
      updated_at: r.updated_at,
      applicant_name: r.profiles?.full_name ?? null,
      applicant_phone: r.profiles?.phone ?? null,
    }))
    .sort(
      (a, b) =>
        (STATUS_ORDER[a.application_status] ?? 9) -
        (STATUS_ORDER[b.application_status] ?? 9)
    );
}
