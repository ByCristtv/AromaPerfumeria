"use client";

import { motion } from "framer-motion";
import SectionHeading from "./SectionHeading";
import ContactCard, { type ContactChannel } from "./ContactCard";
import { CONTACT } from "./contactData";
import { stagger } from "./styles";

// Built from the exact URLs already configured in the project.
const channels: ContactChannel[] = [
  {
    name: "WhatsApp",
    description:
      "Chatea directamente con nuestro equipo",
    cta: "Iniciar conversación",
    url: CONTACT.whatsapp,
    icon: "/icons/whatsapp.svg",
  },
  {
    name: "Instagram",
    description:
      "Mira nuestras últimas publicaciones",
    cta: "Seguir cuenta",
    url: CONTACT.instagram,
    icon: "/icons/instagram.svg",
  },
  {
    name: "Facebook",
    description:
      "Conoce nuestras actualizaciones y promociones",
    cta: "Seguir cuenta",
    url: CONTACT.facebook,
    icon: "/icons/facebook.svg",
  },
  
];

export default function ContactMethods() {
  return (
    <section id="canales" aria-labelledby="canales-heading" className="scroll-mt-24">
      <div id="canales-heading">
        <SectionHeading
          eyebrow="Canales de atención"
          title="Elige cómo"
          emphasis="conectar"
          description="Estamos disponibles donde te sientas más cómodo. Cada canal recibe la misma atención cuidada y cercana."
        />
      </div>

      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        {channels.map((c) => (
          <ContactCard key={c.name} channel={c} />
        ))}
      </motion.div>
    </section>
  );
}
