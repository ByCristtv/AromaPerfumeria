import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * `app/cart/page.tsx` is a Client Component, and Client Components cannot export
 * `metadata`. This layout exists purely to attach it — a per-user cart has no
 * business in a search index.
 */
export const metadata: Metadata = {
  title: "Tu carrito",
  robots: { index: false, follow: false },
};

export default function CartLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
