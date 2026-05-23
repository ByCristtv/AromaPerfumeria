import AdminProductsView from "@/components/admin/AdminProductsView";

/**
 * Admin → Products page.
 *
 * Authorization is enforced in `proxy.ts`, which redirects any
 * non-admin (or unauthenticated) request away from `/admin/*` before
 * this Server Component ever runs. No duplicate check needed here.
 *
 * The page stays a Server Component to keep that auth-gating
 * boundary; all interactive state (modal toggle, form submit) lives
 * inside the client-side `AdminProductsView`.
 */
export default function AdminProductsPage() {
  return <AdminProductsView />;
}
