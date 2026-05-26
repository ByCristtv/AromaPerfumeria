"use client";

import { useSyncExternalStore } from "react";

// useSyncExternalStore signature requires a stable subscribe function. Ours
// never actually subscribes to anything — we just want a value that's `false`
// during SSR and `true` after hydration. The lint rule that flags setState in
// useEffect (`react-hooks/set-state-in-effect`) doesn't complain about this
// pattern, which is what React itself recommends for hydration detection.
const emptySubscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * `true` after the component has mounted on the client. Use to guard
 * against hydration mismatch when rendering values that only exist on
 * the client (e.g. persisted cart totals, `window.*`, `localStorage`).
 *
 * Uses `useSyncExternalStore` rather than the older `useState`+`useEffect`
 * pattern because the lint rule flags the latter as "cascading renders" —
 * even though for hydration detection it's intentional. This is also the
 * pattern React's own docs recommend for "is this rendering on the client?".
 */
export function useIsMounted(): boolean {
  return useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot);
}
