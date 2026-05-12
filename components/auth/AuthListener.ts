"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useCartStore } from "@/store/useCartStore";

export default function AuthListener() {
  const fetchCart = useCartStore((state) => state.fetchCart);

  // Use a ref to read the latest cart without re-creating the subscription
  const cartRef = useRef(useCartStore.getState().cart);

  useEffect(() => {
    // Keep the ref in sync with the store without triggering re-renders
    const unsubStore = useCartStore.subscribe(
      (state) => { cartRef.current = state.cart; }
    );

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const userId = session.user.id;
        const currentCart = cartRef.current;

        if (currentCart.length > 0) {
          const { error } = await (supabase.from("cart_items") as any).upsert(
            currentCart.map(item => ({
              user_id: userId,
              variant_id: item.variant_id,
              quantity: item.quantity,
            })),
            { onConflict: "user_id,variant_id" }
          );

          if (error) console.error("Error sincronizando carrito:", error);
        }

        await fetchCart(userId);
      }

      if (event === "SIGNED_OUT") {
        useCartStore.getState().clearCart();
      }
    });

    return () => {
      subscription.unsubscribe();
      unsubStore();
    };
  }, [fetchCart]);

  return null;
}