import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Singleton Supabase browser client.
 *
 * Use this from Client Components, Zustand stores, React Query hooks,
 * and anywhere else that runs in the browser. For Server Components,
 * Route Handlers, and the proxy, use `lib/supabase/server.ts` instead.
 */
export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
