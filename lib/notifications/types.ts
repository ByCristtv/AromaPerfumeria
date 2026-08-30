/**
 * Notification domain vocabulary.
 *
 * `NotificationType` is the second half of the (order_id, notification_type)
 * uniqueness key that makes delivery idempotent — the string values are a
 * contract with the order_notifications table, so never rename them casually.
 */

export type NotificationType =
  /** SINPE order created; payment still pending manual validation. (→ owner) */
  | "sinpe_order_pending"
  /** Payment confirmed — card via Onvo webhook, or SINPE marked paid. (→ owner) */
  | "order_payment_confirmed"
  /** Order confirmation sent to the CUSTOMER (card=paid, SINPE=pending). */
  | "customer_order_confirmation";

/** How the customer is paying — drives copy and which notifications fire. */
export type OrderPaymentMethod = "card" | "sinpe" | "other";

/** One line of the order, already snapshotted at purchase time in order_items. */
export interface OrderNotificationItem {
  productName: string;
  brandName: string;
  /** full-size bottle vs. decant vs. set — so the owner knows what to prep. */
  productType: "full_size" | "decant" | "set";
  sizeMl: number;
  sku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

/**
 * Everything a template needs to render an order email — assembled once by the
 * data loader so templates stay pure (no DB, no async). Nothing sensitive beyond
 * what the store owner legitimately needs to fulfill the order.
 */
export interface OrderNotificationData {
  id: string;
  orderNumber: number;
  createdAt: string;
  paymentMethod: OrderPaymentMethod;
  /** Raw provider string from orders.payment_provider, for debugging context. */
  paymentProvider: string | null;
  paymentStatus: string;
  orderStatus: string;
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  customer: {
    name: string;
    email: string | null;
    phone: string;
  };
  shipping: {
    province: string;
    canton: string;
    district: string;
    address: string;
    reference: string | null;
  };
  items: OrderNotificationItem[];
}
