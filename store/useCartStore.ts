import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/lib/supabase";

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

type CartStore = {
  cart: CartLineItem[];
  // Acciones
  fetchCart: (userId: string) => Promise<void>;
  addToCart: (item: Omit<CartLineItem, 'quantity'>, userId?: string) => Promise<void>;
  incrementQuantity: (variantId: string, userId?: string) => Promise<void>;
  decrementQuantity: (variantId: string, userId?: string) => Promise<void>;
  removeFromCart: (variantId: string, userId?: string) => Promise<void>;
  clearCart: (userId?: string) => Promise<void>;
  // Helpers
  getTotalItems: () => number;
  getTotalPrice: () => number;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      cart: [],

      // 1. CARGAR CARRITO DESDE DB (Al hacer login)
      fetchCart: async (userId) => {
        const { data, error } = await supabase
          .from('cart_items')
          .select(`
      quantity,
      variant:product_variants (
        id,
        price,
        offer_price,
        is_on_offer,
        stock,
        size_ml,
        product_type,
        product:products ( name, product_images (url) )
      )
    `).eq('user_id', userId);

        if (data && !error) {
          const dbCart: CartLineItem[] = data.map((item: any) => ({
            variant_id: item.variant.id,
            product_name: item.variant.product.name,
            product_type: item.variant.product_type, // <--- Mapeado aquí
            size_ml: item.variant.size_ml,
            price: item.variant.is_on_offer ? item.variant.offer_price : item.variant.price,
            image_url: item.variant.product.product_images[0]?.url || '',
            quantity: item.quantity,
            stock: item.variant.stock
          }));
          set({ cart: dbCart });
        }
      },

      // 2. AGREGAR AL CARRITO
      addToCart: async (newItem, userId) => {
        const { cart } = get();
        const existingItem = cart.find(i => i.variant_id === newItem.variant_id);

        if (userId) {
          // Si hay usuario, upsert en Supabase (usa la restricción uq_cart_user_variant)
          await supabase.from('cart_items').upsert({
            user_id: userId,
            variant_id: newItem.variant_id,
            quantity: existingItem ? Math.min(existingItem.quantity + 1, newItem.stock) : 1
          }, { onConflict: 'user_id,variant_id' });
        }

        // Actualizar estado local
        if (existingItem) {
          set({
            cart: cart.map(i => i.variant_id === newItem.variant_id 
              ? { ...i, quantity: Math.min(i.quantity + 1, i.stock) } 
              : i)
          });
        } else {
          set({ cart: [...cart, { ...newItem, quantity: 1 }] });
        }
      },

      // 3. INCREMENTAR
      incrementQuantity: async (variantId, userId) => {
        const item = get().cart.find(i => i.variant_id === variantId);
        if (!item || item.quantity >= item.stock) return;

        if (userId) {
          await supabase.from('cart_items')
            .update({ quantity: item.quantity + 1 })
            .eq('user_id', userId)
            .eq('variant_id', variantId);
        }

        set({
          cart: get().cart.map(i => i.variant_id === variantId 
            ? { ...i, quantity: i.quantity + 1 } 
            : i)
        });
      },

      // 4. DECREMENTAR
      decrementQuantity: async (variantId, userId) => {
        const item = get().cart.find(i => i.variant_id === variantId);
        if (!item) return;

        if (item.quantity === 1) {
          return get().removeFromCart(variantId, userId);
        }

        if (userId) {
          await supabase.from('cart_items')
            .update({ quantity: item.quantity - 1 })
            .eq('user_id', userId)
            .eq('variant_id', variantId);
        }

        set({
          cart: get().cart.map(i => i.variant_id === variantId 
            ? { ...i, quantity: i.quantity - 1 } 
            : i)
        });
      },

      // 5. ELIMINAR
      removeFromCart: async (variantId, userId) => {
        if (userId) {
          await supabase.from('cart_items')
            .delete()
            .eq('user_id', userId)
            .eq('variant_id', variantId);
        }
        set({ cart: get().cart.filter(i => i.variant_id !== variantId) });
      },

      clearCart: async (userId) => {
        if (userId) {
          await supabase.from('cart_items').delete().eq('user_id', userId);
        }
        set({ cart: [] });
      },

      getTotalItems: () => get().cart.reduce((acc, item) => acc + item.quantity, 0),
      getTotalPrice: () => get().cart.reduce((acc, item) => acc + item.price * item.quantity, 0),
    }),
    { name: "cart-storage" }
  )
);