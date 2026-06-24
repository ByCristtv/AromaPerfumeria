/**
 * Shared types for the admin manual-order flow (orders taken via WhatsApp /
 * Instagram / phone). The `AdminOrderInput` shape mirrors the JSON contract of
 * the `place_admin_order` Postgres RPC.
 */

export type AdminShippingMethod = "delivery" | "pickup";

export interface AdminOrderItemInput {
  variant_id: string;
  quantity: number;
}

export interface AdminOrderCustomerInput {
  name: string;
  phone: string;
  /** Optional — many manual customers only give a phone number. */
  email?: string;
}

export interface AdminOrderShippingInput {
  /** Free-text señas, e.g. "200m sur de la iglesia". */
  address: string;
  /** CR canton code — drives the shipping-cost lookup. */
  canton_code: string;
  canton_name: string;
  province_name: string;
  district?: string;
  reference?: string;
}

export interface AdminOrderInput {
  customer: AdminOrderCustomerInput;
  shipping: AdminOrderShippingInput;
  items: AdminOrderItemInput[];
  shipping_method: AdminShippingMethod;
  /** Optional flat discount in CRC. */
  discount?: number;
  notes?: string;
}

export interface AdminOrderResult {
  order_id: string;
  order_number: number;
  subtotal: number;
  shipping_cost: number;
  discount: number;
  total: number;
  item_count: number;
}
