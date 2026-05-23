import { Database } from "@/types/database";
import { BaseCartItem, CartLineItem } from "@/types/product";

export type CartItemPayload = Omit<CartLineItem, "quantity">;

// 2. Extraemos el tipo de la fila de cart_items para armar el Join estructurado

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