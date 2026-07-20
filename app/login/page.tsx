import type { Metadata } from "next";
import LoginView from "@/components/account/LoginView";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  description: "Accede a tu cuenta para gestionar tus pedidos.",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return <LoginView />;
}
