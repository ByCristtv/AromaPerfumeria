import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Server-side Supabase client using the SERVICE ROLE key. Bypasses RLS entirely.
 *
 * ⚠ SECURITY ⚠
 *   - NEVER import this from a Client Component, Browser hook, or Zustand store.
 *   - NEVER expose the resulting client (or its data) in untrusted contexts.
 *   - Use only for:
 *       • Webhook handlers (incoming payment provider callbacks)
 *       • Server-side reads where RLS is too restrictive AND the access is
 *         legitimately authorized by some other means (e.g., HMAC URL token,
 *         service-to-service calls)
 *
 * The service role key is read from the SUPABASE_SERVICE_ROLE_KEY env var
 * (NOT prefixed with NEXT_PUBLIC_ — so it never ships to the browser bundle).
 *
 * To set it:
 *   Dashboard → Project Settings → API → "service_role" key
 *   Add to .env.local:  SUPABASE_SERVICE_ROLE_KEY=eyJ...
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL env var is missing.");
  }
  if (!serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY env var is missing. " +
        "Add it to .env.local from your Supabase dashboard → Project Settings → API."
    );
  }

  return createSupabaseClient<Database>(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
