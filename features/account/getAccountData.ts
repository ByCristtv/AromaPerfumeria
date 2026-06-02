import { supabase } from "@/lib/supabase/client";
import type { Tables } from "@/types/database";

export type ProfileRow = Tables<"profiles">;
export type AddressRow = Tables<"addresses">;
export type AccountOrderRow = Pick<
  Tables<"orders">,
  | "id"
  | "order_number"
  | "total"
  | "order_status"
  | "payment_status"
  | "created_at"
>;

export interface AccountData {
  profile: ProfileRow | null;
  address: AddressRow | null;
}

export async function getAccountData(userId: string): Promise<AccountData> {
  const [profileRes, addressRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase
      .from("addresses")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return {
    profile: profileRes.data,
    address: addressRes.data,
  };
}

export async function getAccountOrders(
  userId: string
): Promise<AccountOrderRow[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("id, order_number, total, order_status, payment_status, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function updatePhone(userId: string, phone: string) {
  const { error } = await supabase
    .from("profiles")
    .update({ phone })
    .eq("id", userId);
  if (error) throw error;
}

export async function upsertAddress(
  userId: string,
  address: {
    province: string;
    canton: string;
    district: string;
    exact_address: string;
    references?: string | null;
  },
  existingId?: string
) {
  if (existingId) {
    const { error } = await supabase
      .from("addresses")
      .update(address)
      .eq("id", existingId)
      .eq("user_id", userId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("addresses")
      .insert({ ...address, user_id: userId });
    if (error) throw error;
  }
}