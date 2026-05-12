import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import ProductForm from "@/components/admin/ProductForm";
import ProductListAdmin from "@/components/admin/ProductListAdmin";

export default async function AdminProductsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.log("Usuario no autenticado");
    console.log(user);
    redirect("/");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    console.log("No es admin");
    redirect("/");
  }

  return (
    <div className="p-6 space-y-10 mt-16">
        <ProductForm />
        <ProductListAdmin />
    </div>
  );
}