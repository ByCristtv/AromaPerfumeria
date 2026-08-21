import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * Keeps the whole admin panel out of search results. Defence in depth alongside
 * the robots.txt disallow — a crawler that ignores robots.txt still sees this,
 * and it applies to every nested /admin route automatically.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Shared admin layout.
 *
 * Centralizes the background system for every `/admin/*` route so the whole
 * panel reads as one coherent product: a deep charcoal base, a single ambient
 * red halo, and the thin red hairline used across the storefront. Individual
 * pages no longer set their own background — they only provide content inside
 * an <AdminContainer />, which keeps spacing and widths consistent.
 *
 * Auth gating still lives in `proxy.ts` (non-admins never reach these routes),
 * so this layout is purely presentational.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-krov-void">
      {/* Top red hairline — mirrors the navbar / storefront sections. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-krov-blood/30 to-transparent"
      />
      {/* Single ambient red halo for depth without flat color blocks. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-112 w-md -translate-x-1/2 rounded-full bg-krov-blood/[0.07] blur-[140px]"
      />

      <div className="relative">{children}</div>
    </div>
  );
}
