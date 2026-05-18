"use client";

import { useEffect, useState } from "react";

/**
 * `true` after the component has mounted on the client. Use to guard
 * against hydration mismatch when rendering values that only exist on
 * the client (e.g. persisted cart totals, `window.*`, `localStorage`).
 */
export function useIsMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
