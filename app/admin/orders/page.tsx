import type { Metadata } from "next";
import AdminOrdersView from "./AdminOrdersView";

export const metadata: Metadata = {
  title: "Órdenes — Admin",
  description: "Gestión de pedidos.",
};

/**
 * Admin → Orders list.
 *
 * Auth is enforced by proxy.ts before this renders. The page itself is a
 * thin Server Component shell; all interactivity lives in <AdminOrdersView />.
 */
export default function AdminOrdersPage() {
  return <AdminOrdersView />;
}
