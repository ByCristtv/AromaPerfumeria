"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { useCartStore, type CartLineItem } from "@/store/useCartStore";

const CART_ITEMS_SELECT = `
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
` as const;

async function fetchCartFromDB(userId: string): Promise<CartLineItem[]> {
  const { data, error } = await supabase
    .from("cart_items")
    .select(CART_ITEMS_SELECT)
    .eq("user_id", userId);

  if (error || !data) return [];

  return data.map((item: any) => ({
    variant_id: item.variant.id,
    product_name: item.variant.product.name,
    product_type: item.variant.product_type,
    size_ml: item.variant.size_ml,
    price: item.variant.is_on_offer ? item.variant.offer_price : item.variant.price,
    image_url: item.variant.product.product_images[0]?.url ?? "",
    quantity: item.quantity,
    stock: item.variant.stock,
  }));
}

async function mergeLocalCartIntoDB(userId: string, localCart: CartLineItem[]) {
  if (localCart.length === 0) return;
  await supabase.from("cart_items").upsert(
    localCart.map((item) => ({
      user_id: userId,
      variant_id: item.variant_id,
      quantity: item.quantity,
    })),
    { onConflict: "user_id,variant_id" }
  );
}

/**
 * Bridges Supabase auth state and the local Zustand cart store:
 *
 *  - On SIGNED_IN, uploads any guest-mode cart items the user
 *    accumulated before logging in, then pulls the server cart and
 *    replaces the local one.
 *  - On SIGNED_OUT, clears the local cart.
 *
 * Mount once at the root layout. Renders nothing — this is a
 * pure side-effect component, hence the `.ts` extension is valid.
 */
export default function AuthListener(): null {
  const cartRef = useRef(useCartStore.getState().cart);

  useEffect(() => {
    const unsubStore = useCartStore.subscribe((state) => {
      cartRef.current = state.cart;
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const userId = session.user.id;
        await mergeLocalCartIntoDB(userId, cartRef.current);
        const dbCart = await fetchCartFromDB(userId);
        useCartStore.getState().setCart(dbCart);
        return;
      }

      if (event === "SIGNED_OUT") {
        useCartStore.getState().clearCart();
      }
    });

    return () => {
      subscription.unsubscribe();
      unsubStore();
    };
  }, []);

  return null;
}
