"use client";

import { usePathname } from "next/navigation";

/**
 * Renders the footer only on public browsing pages. The big brand footer
 * is a poor fit for transactional/admin flows (checkout, login, admin), so
 * those are excluded. The server-rendered <Footer/> is passed as children,
 * so it stays a server component.
 */
const HIDDEN_PREFIXES = ["/admin", "/checkout", "/login", "/auth", "/cart"];

export default function FooterGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const hidden = HIDDEN_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  if (hidden) return null;
  return <>{children}</>;
}
