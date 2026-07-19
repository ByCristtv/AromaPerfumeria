"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef } from "react";

/**
 * One-way exit from the checkout.
 *
 * Leaving a checkout is a *terminal transition*, but it necessarily destroys the
 * very state the page's "nothing to check out → bounce to /cart" guard watches
 * (an empty cart and no session). Without an explicit signal, that guard fires
 * during the exit and its `router.replace("/cart")` supersedes the in-flight
 * `router.push("/orders/…")`, dumping the customer on an empty cart right after
 * they paid.
 *
 * Timing-based workarounds (clear the cart on a setTimeout, hope navigation wins)
 * are races by construction: an App Router push must fetch the destination's RSC
 * payload first, and `/orders/[id]` is a Server Component doing a token verify
 * plus two Supabase round-trips. Any fixed delay is a bet on that finishing in
 * time.
 *
 * So instead of racing, this makes "we are leaving" explicit and permanent:
 * callers read `hasExited` to disable their guards, and `exit()` is idempotent so
 * a payment SDK that fires its success callback twice can't double-navigate.
 */
export interface CheckoutExit {
  /**
   * Navigate away for good. The first call wins; later calls are no-ops.
   *
   * `cleanup` runs synchronously before the push. That is safe because
   * `destination` is passed in already-built — clearing state afterwards cannot
   * corrupt a URL that has already been computed — and because callers gate their
   * redirect guards on `hasExited` rather than on the state being cleared.
   */
  exit: (destination: string, cleanup?: () => void) => void;
  /**
   * True once `exit` has been called. A ref, not state, so guards can read it
   * synchronously in the same commit that cleanup triggers — there is no
   * intermediate render where the guard sees "empty" but not yet "leaving".
   */
  hasExited: React.RefObject<boolean>;
}

export function useCheckoutExit(): CheckoutExit {
  const router = useRouter();
  const hasExited = useRef(false);

  const exit = useCallback(
    (destination: string, cleanup?: () => void) => {
      if (hasExited.current) return;
      hasExited.current = true;

      cleanup?.();
      router.push(destination);
    },
    [router]
  );

  return { exit, hasExited };
}
