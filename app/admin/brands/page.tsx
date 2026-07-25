import BrandsView from "@/components/admin/brands/BrandsView";

/**
 * Admin → "Administrar Marcas" page.
 *
 * Authorization is enforced in `proxy.ts`, which redirects any non-admin (or
 * unauthenticated) request away from `/admin/*` before this Server Component
 * ever runs — no duplicate check needed here.
 *
 * Stays a Server Component to keep that auth-gating boundary; all interactive
 * state (search, pagination, CRUD modals) lives inside the client-side
 * `BrandsView`.
 */
export default function AdminBrandsPage() {
  return <BrandsView />;
}
