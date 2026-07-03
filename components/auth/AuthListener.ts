"use client";
import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { useCartStore } from "@/store/useCartStore";
import { CartLineItem } from "@/types/product";
import { fetchCartFromDB } from "@/services/cartService";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

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
      void handleAuthChange(event, session);
    });
    async function handleAuthChange(
      event: AuthChangeEvent,
      session: Session | null
    ) {
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
    }

    return () => {
      subscription.unsubscribe();
      unsubStore();
    };
  }, []);

  return null;
}