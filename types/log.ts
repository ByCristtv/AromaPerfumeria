// ============================================================
// Aroma Perfumería — Database TypeScript Types
// Auto-mirrors supabase/schema.sql
// ============================================================

// ── Enums ────────────────────────────────────────────────────

export type UserRole = "customer" | "admin";

export type OrderStatus = "pending" | "received" | "shipped" | "denied";

export type ProductType = "full_size" | "decant";

// ── Table Row Types ──────────────────────────────────────────

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  role: UserRole;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  brand_id: string;
  description: string;
  product_type: ProductType;
  size_ml: number;
  price: number;
  is_on_offer: boolean;
  offer_price: number | null;
  stock: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_text: string | null;
  position: number;
  created_at: string;
}

export interface ProductCategory {
  product_id: string;
  category_id: string;
}

export interface Address {
  id: string;
  user_id: string;
  label: string;
  recipient_name: string;
  street_line_1: string;
  street_line_2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  added_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  status: OrderStatus;
  address_line: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  recipient_name: string;
  recipient_phone: string | null;
  subtotal: number;
  discount_total: number;
  total: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_size_ml: number;
  unit_price: number;
  quantity: number;
  line_total: number; // generated column
}

// ── Insert / Update helpers ──────────────────────────────────

export type ProductInsert = Omit<Product, "id" | "created_at" | "updated_at">;
export type ProductUpdate = Partial<ProductInsert>;

export type OrderInsert = Omit<Order, "id" | "created_at" | "updated_at">;
export type OrderItemInsert = Omit<OrderItem, "id" | "line_total">;

export type CartItemInsert = Pick<CartItem, "user_id" | "product_id" | "quantity">;

export type AddressInsert = Omit<Address, "id" | "created_at" | "updated_at">;
export type AddressUpdate = Partial<AddressInsert>;

// ── Joined / Enriched types (used by the UI) ─────────────────

export interface ProductWithDetails extends Product {
  brand: Brand;
  categories: Category[];
  images: ProductImage[];
}

export interface CartItemWithProduct extends CartItem {
  product: ProductWithDetails;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
  user: Pick<Profile, "id" | "full_name" | "email">;
}

// ── Admin dashboard ──────────────────────────────────────────

export interface DashboardSummary {
  total_products_sold: number;
  gross_sales: number;
  total_profit: number;
  total_orders: number;
}

export interface TopProduct {
  product_id: string;
  product_name: string;
  total_sold: number;
  revenue: number;
}
