import DecantStockView from "@/components/admin/DecantStockView";

/**
 * Admin → Stock para Decants page.
 *
 * Authorization is enforced in `proxy.ts`, which redirects any non-admin (or
 * unauthenticated) request away from `/admin/*` before this Server Component
 * ever runs — no duplicate check needed here.
 *
 * Stays a Server Component to keep that auth-gating boundary; all interactive
 * state (modal toggle, transform submit) lives inside the client-side
 * `DecantStockView`.
 */
export default function AdminDecantStockPage() {
  return <DecantStockView />;
}
