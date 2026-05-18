import { supabase } from "@/lib/supabase/client";

export async function getBrands() {
  const { data, error } = await supabase
    .from("brands")
    .select("id, name")
    .order("name");

  if (error) throw new Error(error.message);
  return data ?? [];
}
