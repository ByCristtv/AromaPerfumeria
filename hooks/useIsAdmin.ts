"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";

const PROFILE_ROLE_QUERY_KEY = ["profile", "role"] as const;

/**
 * Returns whether the currently signed-in user has the `admin` role.
 *
 * Implemented as a React Query so the result is shared across
 * components (Navbar, admin-only widgets) and stays in sync with
 * auth state changes via the QueryClient cache.
 */
export function useIsAdmin(): boolean {
  const { data: isAdmin = false } = useQuery({
    queryKey: PROFILE_ROLE_QUERY_KEY,
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      return profile?.role === "admin";
    },
    staleTime: 5 * 60 * 1000,
  });

  return isAdmin;
}
