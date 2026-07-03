import { BaseCartItem, CartLineItem } from "@/types/product";

export type CartItemPayload = Omit<CartLineItem, "quantity">;

/** Nested cart_items → variant → product join shape consumed by cartService. */
export interface DbCartQueryResponse {
  quantity: BaseCartItem["quantity"];
  variant: {
    id: string;
    price: number;
    offer_price: number | null;
    is_on_offer: boolean;
    stock: number;
    size_ml: number;
    product_type: string;
    product: {
      name: string;
      product_images: { url: string }[];
    } | null;
  } | null;
}