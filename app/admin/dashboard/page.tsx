import type { Metadata } from "next";
import AnalyticsDashboard from "./AnalyticsDashboard";

export const metadata: Metadata = {
  title: "Dashboard — Admin",
  description: "Métricas de ventas e inventario.",
};

/**
 * Admin → Dashboard.
 *
 * Auth enforced by proxy.ts; this is a thin shell. All state lives in
 * <AnalyticsDashboard /> so it can be a Client Component using hooks.
 */
export default function AdminDashboardPage() {
  return <AnalyticsDashboard />;
}
