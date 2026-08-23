import { vi } from "vitest";

/**
 * A tiny, chainable Supabase client mock for testing server actions + data
 * helpers without a database. Supports the exact call shapes the wholesale code
 * uses:
 *   .auth.getUser()
 *   .from(t).select(..).eq(..).single() / .maybeSingle()
 *   .from(t).insert(row)
 *   .from(t).update(row).eq(..)
 *   .rpc(name, args)
 *
 * Captures the last insert/update/rpc so tests can assert on the payload.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface SupabaseMockConfig {
  user?: { id: string } | null;
  /** Value of profiles.role for `.from("profiles").select("role").single()`. */
  profileRole?: string | null;
  profileError?: { message: string } | null;
  /** Row returned for `.from("wholesale_profiles")...maybeSingle()`. */
  existingApplication?: { application_status: string } | null;
  insertError?: { message: string } | null;
  /**
   * `code` is optional but matters: actions that translate Postgres errors into
   * user-facing copy (e.g. 23505 → "that username is taken") branch on it.
   */
  updateError?: { message: string; code?: string } | null;
  /** Result for `.rpc(...)`. */
  rpc?: (
    name: string,
    args: unknown
  ) => { data: unknown; error: { message: string } | null };
}

export interface CapturedCalls {
  insert?: { table: string; row: any };
  update?: { table: string; row: any };
  rpc?: { name: string; args: any };
}

export interface SupabaseMock {
  client: any;
  captured: CapturedCalls;
}

export function makeSupabaseMock(config: SupabaseMockConfig = {}): SupabaseMock {
  const captured: CapturedCalls = {};

  function from(table: string) {
    const builder: any = {
      select: () => builder,
      eq: () => builder,
      in: () => builder,
      order: () => builder,
      single: async () => {
        if (table === "profiles") {
          return {
            data: config.profileRole != null ? { role: config.profileRole } : null,
            error: config.profileError ?? null,
          };
        }
        return { data: null, error: null };
      },
      maybeSingle: async () => {
        if (table === "wholesale_profiles") {
          return { data: config.existingApplication ?? null, error: null };
        }
        return { data: null, error: null };
      },
      insert: async (row: any) => {
        captured.insert = { table, row };
        return { error: config.insertError ?? null };
      },
      update: (row: any) => {
        captured.update = { table, row };
        return { eq: async () => ({ error: config.updateError ?? null }) };
      },
    };
    return builder;
  }

  const client = {
    auth: {
      getUser: async () => ({ data: { user: config.user ?? null } }),
    },
    from: vi.fn(from),
    rpc: vi.fn(async (name: string, args: unknown) => {
      captured.rpc = { name, args };
      return config.rpc ? config.rpc(name, args) : { data: null, error: null };
    }),
  };

  return { client, captured };
}
