import type { Metadata } from "next";
import AdminOrderCreateView from "./AdminOrderCreateView";

export const metadata: Metadata = {
  title: "Crear orden — Admin · Aroma Perfumería",
  description: "Crear un pedido manual para un cliente.",
};

/**
 * Admin → Orders → Create.
 *
 * Auth is enforced by proxy.ts before this renders. Thin Server Component
 * shell; all interactivity lives in <AdminOrderCreateView />.
 */
export default function AdminOrderCreatePage() {
  return <AdminOrderCreateView />;
}
