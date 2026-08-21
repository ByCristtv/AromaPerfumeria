import type { Metadata } from "next";
import RegisterForm from "@/components/account/RegisterForm";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Crear cuenta",
  description:
    "Crea tu cuenta en KROV Perfumería para gestionar pedidos, direcciones y favoritos.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
