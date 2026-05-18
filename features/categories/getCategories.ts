import { supabase } from "@/lib/supabase/client";

export async function getCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name")
    .order("name");

  if (error) throw new Error(error.message);
  return data ?? [];
}
