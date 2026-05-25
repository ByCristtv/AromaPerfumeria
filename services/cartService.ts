import { supabase } from "../lib/supabase/client";
import { CartLineItem } from "@/types/product";
import { DbCartQueryResponse } from "@/types/cart";

export async function getAuthUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function fetchCartFromDB(userId: string): Promise<CartLineItem[]> {
  const { data, error } = await supabase
  .from("cart_items")
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
      product:products!product_variants_product_id_fkey (
        name,
        product_images (url)
      )
    )
  `)
  .eq("user_id", userId);

  if (error) {
  console.error("Error fetching cart:", error);
  throw error;
  }

  if (!data) return [];

  const dbItems = data as unknown as DbCartQueryResponse[];

  return dbItems
    .filter((item) => item.variant && item.variant.product)
    .map((item) => {
      const v = item.variant!;
      const prod = v.product!;
      return {
        variant_id: v.id,
        product_name: prod.name,
        product_type: v.product_type as any,
        size_ml: v.size_ml,
        price: v.is_on_offer && v.offer_price !== null ? v.offer_price : v.price,
        image_url: prod.product_images?.[0]?.url || "",
        quantity: item.quantity,
        stock: v.stock,
      };
    });
}

export async function syncCartToDB(userId: string, cart: CartLineItem[]) {
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

export async function removeCartItemFromDB(userId: string, variantId: string) {
  await supabase
    .from("cart_items")
    .delete()
    .eq("user_id", userId)
    .eq("variant_id", variantId);
}

export async function upsertCartItemInDB(userId: string, variantId: string, quantity: number) {
  await supabase
    .from("cart_items")
    .upsert(
      { user_id: userId, variant_id: variantId, quantity },
      { onConflict: "user_id,variant_id" }
    );
}

export async function clearCartInDB(userId: string) {
  await supabase.from("cart_items").delete().eq("user_id", userId);
}