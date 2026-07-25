import type { Metadata } from "next";
import HowToBuyExperience from "@/components/howtobuy/HowToBuyExperience";

export const metadata: Metadata = {
  alternates: { canonical: "/howtobuy" },
  title: "Cómo Comprar",
  description:
    "Guía paso a paso para comprar en Aroma Perfumería: explora el catálogo, elige tu presentación, paga de forma segura con tarjeta o SINPE Móvil y recibe tu fragancia con la mejor experiencia.",
};

export default function HowToBuyPage() {
  return <HowToBuyExperience />;
}