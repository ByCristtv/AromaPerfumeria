import ProductForm from "@/components/admin/ProductForm";
import ProductListAdmin from "@/components/admin/ProductListAdmin";

/**
 * Admin → Products page.
 *
 * Authorization is enforced in `proxy.ts`, which redirects any
 * non-admin (or unauthenticated) request away from `/admin/*` before
 * this Server Component ever runs. No duplicate check needed here.
 */
export default function AdminProductsPage() {
  return (
    <div className="p-6 space-y-10 mt-16">
      <ProductForm />
      <ProductListAdmin />
    </div>
  );
}
