import { useMutation } from "@tanstack/react-query";
import { useCartStore } from "@/store/useCartStore";
import { useCallback } from "react";
import { CartLineItem } from "@/types/product";
import * as CartAPI from "@/services/cartService"; 
import { CartItemPayload } from "@/types/cart";

export function useCart() {
  const store = useCartStore();

  const rollback = useCallback(
    (snapshot: CartLineItem[]) => {
      store.setCart(snapshot);
    },
    [store]
  );

  const addItemMutation = useMutation({
    mutationFn: async (item: CartItemPayload) => {
      const snapshot = [...store.cart];
      store.addItem(item); // Optimistic UI

      const userId = await CartAPI.getAuthUserId();
      if (userId) {
        const updatedCart = useCartStore.getState().cart;
        await CartAPI.syncCartToDB(userId, updatedCart);
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
      store.removeItem(variantId); // Optimistic UI

      const userId = await CartAPI.getAuthUserId();
      if (userId) {
        await CartAPI.removeCartItemFromDB(userId, variantId);
      }
      return snapshot;
    },
    onError: (_error, _variantId, context) => {
      if (context) rollback(context as CartLineItem[]);
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ variantId, quantity }: { variantId: string; quantity: number }) => {
      const snapshot = [...store.cart];
      store.updateQuantity(variantId, quantity); // Optimistic UI

      const userId = await CartAPI.getAuthUserId();
      if (userId) {
        if (quantity <= 0) {
          await CartAPI.removeCartItemFromDB(userId, variantId);
        } else {
          const item = store.cart.find((i) => i.variant_id === variantId);
          if (item) {
            await CartAPI.upsertCartItemInDB(userId, variantId, Math.min(quantity, item.stock));
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
      store.clearCart(); // Optimistic UI

      const userId = await CartAPI.getAuthUserId();
      if (userId) {
        await CartAPI.clearCartInDB(userId);
      }
      return snapshot;
    },
    onError: (_error, _vars, context) => {
      if (context) rollback(context as CartLineItem[]);
    },
  });

  // Exportamos los métodos de manera limpia
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
        updateQuantityMutation.mutate({ variantId, quantity: item.quantity + 1 });
      }
    },
    
    decrementQuantity: (variantId: string) => {
      const item = store.cart.find((i) => i.variant_id === variantId);
      if (item) {
        updateQuantityMutation.mutate({ variantId, quantity: item.quantity - 1 });
      }
    },
    
    clearCart: () => clearCartMutation.mutate(),
    
    isAdding: addItemMutation.isPending,
    isRemoving: removeItemMutation.isPending,
    isUpdating: updateQuantityMutation.isPending,
  };
}