"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthUser } from "@/hooks/useAuthUser";
import { getWholesaleEligibility } from "@/features/wholesale/wholesaleProfile";
import type { WholesaleEligibility } from "@/types/wholesale";

export const WHOLESALE_STATUS_QUERY_KEY = ["wholesale", "status"] as const;

const GUEST: WholesaleEligibility = {
  isApproved: false,
  role: null,
  status: null,
};

export interface UseWholesaleStatusResult {
  eligibility: WholesaleEligibility;
  /** Shortcut for `eligibility.isApproved`. */
  isApproved: boolean;
  isLoading: boolean;
}

/**
 * The current user's wholesale eligibility (role + application status), shared
 * across components via React Query. Keyed by user id so a logout/login can
 * never surface the previous identity's status. Drives cart/checkout pricing.
 */
export function useWholesaleStatus(): UseWholesaleStatusResult {
  const { user, isLoading: authLoading } = useAuthUser();

  const query = useQuery<WholesaleEligibility>({
    queryKey: [...WHOLESALE_STATUS_QUERY_KEY, user?.id],
    queryFn: () => getWholesaleEligibility(user!.id),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const eligibility = user ? query.data ?? GUEST : GUEST;

  return {
    eligibility,
    isApproved: eligibility.isApproved,
    // Auth resolving, or (once we know there's a user) the status still loading.
    isLoading: authLoading || (!!user && query.isPending),
  };
}
