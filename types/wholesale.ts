import type { Tables } from "@/types/database";

/** A row of the `wholesale_profiles` table. */
export type WholesaleProfileRow = Tables<"wholesale_profiles">;

/**
 * The three states of `wholesale_profiles.application_status`. The DB stores it
 * as text with a CHECK constraint, so the generated type widens to `string`;
 * narrow to this union at every boundary that reads it.
 */
export type WholesaleApplicationStatus = "pending" | "approved" | "rejected";

export const WHOLESALE_STATUSES: readonly WholesaleApplicationStatus[] = [
  "pending",
  "approved",
  "rejected",
] as const;

/** Narrow a raw `application_status` string to the status union (null if unknown). */
export function toApplicationStatus(
  value: string | null | undefined
): WholesaleApplicationStatus | null {
  return value === "pending" || value === "approved" || value === "rejected"
    ? value
    : null;
}

/** What the customer fills in the wholesale application form. */
export interface WholesaleApplicationInput {
  company_name: string;
  tax_id: string;
  business_activity: string;
  website?: string | null;
}

/**
 * Whether the current user may receive wholesale pricing.
 * Both conditions are required (defense in depth): the role gate AND an approved
 * application. A role of 'wholesale' without an approved row — or an approved row
 * without the role — is treated as NOT eligible.
 */
export interface WholesaleEligibility {
  isApproved: boolean;
  role: Tables<"profiles">["role"] | null;
  status: WholesaleApplicationStatus | null;
}
