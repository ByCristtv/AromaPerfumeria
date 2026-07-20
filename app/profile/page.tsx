import type { Metadata } from "next";
import ProfileView from "@/components/account/ProfileView";

export const metadata: Metadata = {
  title: "Mi perfil",
  description: "Gestiona tus datos, tu dirección de entrega y tus pedidos.",
  // Personal account pages must never be indexed.
  robots: { index: false, follow: false },
};

export default function ProfilePage() {
  return <ProfileView />;
}
