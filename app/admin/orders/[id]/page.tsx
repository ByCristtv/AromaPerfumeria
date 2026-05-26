import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminOrderDetail from "./AdminOrderDetail";

export const metadata: Metadata = {
  title: "Pedido — Admin · Aroma Perfumería",
};

interface AdminOrderPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Admin → Orders → [id] detail page.
 *
 * Auth is enforced by proxy.ts; RLS lets admins read all orders via the
 * existing "Admins can view all orders" policy, so the cookies-aware
 * client is sufficient (no service-role bypass needed here).
 *
 * Server-renders the order, hands it to the client component for actions.
 */
export default async function AdminOrderPage({ params }: AdminOrderPageProps) {
  const { id } = await params;

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    notFound();
  }

  const supabase = await createClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      order_number,
      customer_name,
      customer_email,
      customer_phone,
      shipping_address,
      shipping_canton,
      shipping_district,
      shipping_province,
      shipping_reference,
      shipping_method,
      shipping_cost,
      subtotal,
      total,
      tax,
      discount,
      order_status,
      payment_status,
      payment_provider,
      payment_reference,
      paid_at,
      source,
      notes,
      created_at,
      updated_at,
      order_items (
        id,
        product_name,
        brand_name,
        size_ml,
        sku,
        quantity,
        unit_price,
        line_total
      )
      `
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[admin/orders/[id]] fetch failed", { id, error });
    throw new Error("No pudimos cargar el pedido.");
  }
  if (!order) {
    notFound();
  }

  return <AdminOrderDetail order={order} />;
}
