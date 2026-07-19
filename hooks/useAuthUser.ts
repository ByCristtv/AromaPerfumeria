"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

export const AUTH_USER_QUERY_KEY = ["auth", "user"] as const;
const PROFILE_ROLE_QUERY_KEY = ["profile", "role"] as const;

export interface AuthUserState {
  user: User | null;
  /** True only on the first resolve — lets callers avoid a guest/auth flash. */
  isLoading: boolean;
  isAuthenticated: boolean;
}

/**
 * The single source of truth for "who is signed in", shared across the app.
 *
 * Before this, every consumer ran its own `supabase.auth.getUser()` — the Navbar
 * had none at all (hence the permanent "MI CUENTA" button) and `useIsAdmin` kept
 * a separate copy. Routing it through React Query means one network call, one
 * cache, and a consistent answer everywhere on the page.
 *
 * The subscription below also fixes a real staleness bug: `useIsAdmin` caches the
 * role for 5 minutes, so before this it could keep reporting the PREVIOUS user's
 * admin rights for minutes after a logout/login. Auth changes now push the new
 * user into the cache and drop the derived role so it refetches for the new
 * identity.
 */
export function useAuthUser(): AuthUserState {
  const queryClient = useQueryClient();

  const { data: user = null, isPending } = useQuery<User | null>({
    queryKey: AUTH_USER_QUERY_KEY,
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user ?? null;
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // Write straight into the cache — we already have the authoritative user
      // on the event, so a refetch would be a wasted round-trip.
      queryClient.setQueryData(AUTH_USER_QUERY_KEY, session?.user ?? null);
      // Role is derived from identity; it must not survive an identity change.
      void queryClient.invalidateQueries({ queryKey: PROFILE_ROLE_QUERY_KEY });
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  return { user, isLoading: isPending, isAuthenticated: user !== null };
}
