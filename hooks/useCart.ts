import { useMutation } from "@tanstack/react-query";
import { useCartStore, CartLineItem } from "@/store/useCartStore";
import { supabase } from "@/lib/supabase";
import { useCallback, useEffect, useState } from "react";

type CartItemPayload = Omit<CartLineItem, "quantity">;

async function getAuthUserId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

async function syncCartToDB(userId: string, cart: CartLineItem[]) {
  if (cart.length === 0) {
    await supabase.from("cart_items").delete().eq("user_id", userId);
    return;
  }

  await supabase.from("cart_items").upsert(
    cart.map((item) => ({
      user_id: userId,
      variant_id: item.variant_id,
      quantity: item.quantity,
    })),
    { onConflict: "user_id,variant_id" }
  );

  const variantIds = cart.map((i) => i.variant_id);
  await supabase
    .from("cart_items")
    .delete()
    .eq("user_id", userId)
    .not("variant_id", "in", `(${variantIds.join(",")})`);
}

async function fetchCartFromDB(userId: string): Promise<CartLineItem[]> {
  const { data, error } = await supabase
    .from("cart_items")
    .select(
      `
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
    `
    )
    .eq("user_id", userId);

  if (error || !data) return [];

  return data.map((item: any) => ({
    variant_id: item.variant.id,
    product_name: item.variant.product.name,
    product_type: item.variant.product_type,
    size_ml: item.variant.size_ml,
    price: item.variant.is_on_offer
      ? item.variant.offer_price
      : item.variant.price,
    image_url: item.variant.product.product_images[0]?.url || "",
    quantity: item.quantity,
    stock: item.variant.stock,
  }));
}

export function useCart() {
  const store = useCartStore();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    getAuthUserId().then(setUserId);
  }, []);

  const rollback = useCallback(
    (snapshot: CartLineItem[]) => {
      store.setCart(snapshot);
    },
    [store]
  );

  const addItemMutation = useMutation({
    mutationFn: async (item: CartItemPayload) => {
      const snapshot = [...store.cart];
      store.addItem(item);

      if (userId) {
        const updatedCart = useCartStore.getState().cart;
        await syncCartToDB(userId, updatedCart);
      }

      return snapshot;
    },
    onError: (_error, _item, context) => {
      if (context) rollback(context as CartLineItem[]);
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async (variantId: string) => {
      const snapshot = [...store.cart];
      store.removeItem(variantId);

      if (userId) {
        await supabase
          .from("cart_items")
          .delete()
          .eq("user_id", userId)
          .eq("variant_id", variantId);
      }

      return snapshot;
    },
    onError: (_error, _variantId, context) => {
      if (context) rollback(context as CartLineItem[]);
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({
      variantId,
      quantity,
    }: {
      variantId: string;
      quantity: number;
    }) => {
      const snapshot = [...store.cart];
      store.updateQuantity(variantId, quantity);

      if (userId) {
        if (quantity <= 0) {
          await supabase
            .from("cart_items")
            .delete()
            .eq("user_id", userId)
            .eq("variant_id", variantId);
        } else {
          const item = store.cart.find((i) => i.variant_id === variantId);
          if (item) {
            await supabase
              .from("cart_items")
              .upsert(
                {
                  user_id: userId,
                  variant_id: variantId,
                  quantity: Math.min(quantity, item.stock),
                },
                { onConflict: "user_id,variant_id" }
              );
          }
        }
      }

      return snapshot;
    },
    onError: (_error, _vars, context) => {
      if (context) rollback(context as CartLineItem[]);
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: async () => {
      const snapshot = [...store.cart];
      store.clearCart();

      if (userId) {
        await supabase.from("cart_items").delete().eq("user_id", userId);
      }

      return snapshot;
    },
    onError: (_error, _vars, context) => {
      if (context) rollback(context as CartLineItem[]);
    },
  });

  const mergeCart = useCallback(
    async (authUserId: string) => {
      const localCart = useCartStore.getState().cart;

      if (localCart.length > 0) {
        await supabase.from("cart_items").upsert(
          localCart.map((item) => ({
            user_id: authUserId,
            variant_id: item.variant_id,
            quantity: item.quantity,
          })),
          { onConflict: "user_id,variant_id" }
        );
      }

      const dbCart = await fetchCartFromDB(authUserId);
      store.setCart(dbCart);
    },
    [store]
  );

  return {
    cart: store.cart,
    totalItems: store.getTotalItems(),
    totalPrice: store.getTotalPrice(),
    addItem: (item: CartItemPayload) => addItemMutation.mutate(item),
    removeItem: (variantId: string) => removeItemMutation.mutate(variantId),
    updateQuantity: (variantId: string, quantity: number) =>
      updateQuantityMutation.mutate({ variantId, quantity }),
    incrementQuantity: (variantId: string) => {
      const item = store.cart.find((i) => i.variant_id === variantId);
      if (item && item.quantity < item.stock) {
        updateQuantityMutation.mutate({
          variantId,
          quantity: item.quantity + 1,
        });
      }
    },
    decrementQuantity: (variantId: string) => {
      const item = store.cart.find((i) => i.variant_id === variantId);
      if (item) {
        updateQuantityMutation.mutate({
          variantId,
          quantity: item.quantity - 1,
        });
      }
    },
    clearCart: () => clearCartMutation.mutate(),
    mergeCart,
    isAdding: addItemMutation.isPending,
    isRemoving: removeItemMutation.isPending,
    isUpdating: updateQuantityMutation.isPending,
  };
}
