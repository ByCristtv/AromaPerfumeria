import type { Metadata } from "next";
import ContactExperience from "@/components/contact/ContactExperience";

export const metadata: Metadata = {
  title: "Contacto · Aroma Perfumería",
  description:
    "Ponte en contacto con Aroma Perfumería. Te ayudamos con productos, pedidos, envíos y recomendaciones por WhatsApp, Instagram y Facebook. Atención personalizada y cercana.",
};

export default function ContactPage() {
  return <ContactExperience />;
}
