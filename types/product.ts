import { Database } from "./database";

export type ProductTypes = "full_size" | "decant"

export type BaseCartItem = Database["public"]["Tables"]["cart_items"]["Row"];

export interface DbCartQueryResponse {
  quantity: BaseCartItem["quantity"];
  variant: {
    id: string;
    price: number;
    offer_price: number | null;
    is_on_offer: boolean;
    stock: number;
    size_ml: number;
    product_type: string; // O tu enum ProductTypes si coincide
    product: {
      name: string;
      product_images: { url: string }[];
    } | null;
  } | null;
}

interface AdminProductCategory {
  id: string;
  name: string;
}

/**
 * Admin table row. One entry per `product_variants` SKU — the unit of
 * inventory the admin actually manages. Parent product fields (name,
 * brand, categories) are flattened upward for rendering convenience.
 */
export interface AdminVariantRow {
  variant_id: string;
  product_id: string;
  sku: string;
  size_ml: number;
  product_type: ProductTypes;
  price: number;
  stock: number;
  is_on_offer: boolean;
  offer_price: number | null;
  is_active: boolean;
  name: string;
  description: string | null;
  brand: string;
  categories: AdminProductCategory[];
}
export interface ProductVariant {
  id: string;
  price: number;
  offer_price: number | null;
  is_on_offer: boolean;
  stock: number;
  size_ml: number;
  product_type: ProductTypes;
  position: number;
}

export interface ProductDetailData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  gender: "masculine" | "feminine" | "unisex";
  concentration: string;
  notes_top: string | null;
  notes_middle: string | null;
  notes_base: string | null;
  featured_variant_id: string | null;
  brands: { name: string } | null;
  categories: { id: string; name: string }[];
  product_variants: ProductVariant[];
  product_images: {
    url: string;
    position: number;
    alt_text: string | null;
  }[];
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