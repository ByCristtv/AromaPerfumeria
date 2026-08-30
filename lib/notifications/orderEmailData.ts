import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { OrderNotificationData, OrderPaymentMethod } from "./types";

type AdminClient = SupabaseClient<Database>;

/**
 * Load an order + its line items and shape them into the flat, template-ready
 * OrderNotificationData. Single responsibility: reads, maps, and normalizes —
 * no email, no HTML, no side effects.
 *
 * Uses the admin client because it runs from already-authorized server contexts
 * (webhook, admin action, post-checkout) where there is no user session to scope
 * RLS by. Returns null when the order vanished (e.g. deleted) so the caller can
 * bail without emailing about nothing.
 */
export async function loadOrderNotificationData(
  admin: AdminClient,
  orderId: string
): Promise<OrderNotificationData | null> {
  const { data, error } = await admin
    .from("orders")
    .select(
      `id, order_number, created_at,
       payment_provider, payment_status, order_status,
       subtotal, shipping_cost, discount, total,
       customer_name, customer_email, customer_phone,
       shipping_province, shipping_canton, shipping_district,
       shipping_address, shipping_reference,
       order_items (
         product_name, brand_name, product_type, size_ml, sku,
         quantity, unit_price, line_total
       )`
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    console.error("[notifications] order load failed", { orderId, error });
    return null;
  }
  if (!data) {
    console.warn("[notifications] order not found for notification", { orderId });
    return null;
  }

  return {
    id: data.id,
    orderNumber: data.order_number,
    createdAt: data.created_at,
    paymentMethod: toPaymentMethod(data.payment_provider),
    paymentProvider: data.payment_provider,
    paymentStatus: data.payment_status,
    orderStatus: data.order_status,
    subtotal: Number(data.subtotal),
    shippingCost: Number(data.shipping_cost),
    discount: Number(data.discount),
    total: Number(data.total),
    customer: {
      name: data.customer_name,
      email: data.customer_email,
      phone: data.customer_phone,
    },
    shipping: {
      province: data.shipping_province,
      canton: data.shipping_canton,
      district: data.shipping_district,
      address: data.shipping_address,
      reference: data.shipping_reference,
    },
    items: (data.order_items ?? []).map((item) => ({
      productName: item.product_name,
      brandName: item.brand_name,
      productType: item.product_type,
      sizeMl: Number(item.size_ml),
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: Number(item.unit_price),
      lineTotal: Number(item.line_total),
    })),
  };
}

/**
 * Map the free-text orders.payment_provider column to the closed set the
 * templates branch on. Mirrors lib/checkout/types PaymentProvider without
 * importing checkout internals into the notification layer.
 */
function toPaymentMethod(provider: string | null): OrderPaymentMethod {
  if (provider === "onvo") return "card";
  if (provider === "manual_sinpe") return "sinpe";
  return "other";
}
