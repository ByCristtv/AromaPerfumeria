import type { ProductTypes } from "./database";

/**
 * Shape returned by `features/products/getProducts` and consumed by
 * `<ProductCard>`. This is the join of `products`, the featured variant,
 * the brand, and the product images — i.e., everything a card needs to
 * render without an extra round-trip.
 */
interface AdminProductCategory {
  id: string;
  name: string;
}

export interface AdminProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  brand: string;
  categories: AdminProductCategory[];
}
export interface ProductCardData {
  id: string;
  name: string;
  slug: string;
  gender: "masculine" | "feminine" | "unisex";
  concentration: string;
  brands: { name: string };
  featured_variant: {
    id: string;
    price: number;
    offer_price: number | null;
    is_on_offer: boolean;
    stock: number;
    size_ml: number;
    product_type: ProductTypes;
  } | null;
  product_images: {
    url: string;
    position: number;
  }[];
}

/** Payload for the admin "create product + first variant" RPC. */
export interface CreateProductDTO {
  // Base product
  name: string;
  brand_id: string;
  description: string;
  notes_top: string;
  notes_middle: string;
  notes_base: string;
  gender: string;
  concentration: string;
  category_ids: string[];
  file: File;
  // Initial variant
  sku: string;
  price: number;
  stock: number;
  size_ml: number;
  product_type: ProductTypes;
  is_on_offer: boolean;
  offer_price: number | null;
}

/** Payload for adding an extra variant to an existing product. */
export interface CreateVariantDTO {
  product_id: string;
  sku: string;
  price: number;
  stock: number;
  size_ml: number;
  product_type: ProductTypes;
  is_on_offer: boolean;
  offer_price: number | null;
}

export type CartLineItem = {
  variant_id: string;
  product_name: string;
  product_type: string;
  size_ml: number;
  price: number;
  image_url: string;
  quantity: number;
  stock: number;
};

export type CartStore = {
  cart: CartLineItem[];
  setCart: (cart: CartLineItem[]) => void;
  addItem: (item: Omit<CartLineItem, "quantity">) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
};