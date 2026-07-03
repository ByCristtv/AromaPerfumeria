import type { Metadata } from "next";
import RegisterForm from "@/components/account/RegisterForm";

export const metadata: Metadata = {
  title: "Crear cuenta · Aroma Perfumería",
  description:
    "Crea tu cuenta en Aroma Perfumería para gestionar pedidos, direcciones y favoritos.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
