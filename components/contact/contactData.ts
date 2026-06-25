// Single source of truth for contact channels.
// URLs are reused EXACTLY as configured in the original contact page — do not edit.

export const CONTACT = {
  whatsapp: "https://wa.me/71387812",
  instagram: "https://www.instagram.com/aromaperfumeriacr/",
  facebook: "https://www.facebook.com/aromaperfumeriacr?locale=es_LA",
} as const;

export type Social = {
  key: keyof typeof CONTACT;
  name: string;
  handle: string;
  description: string;
  url: string;
  icon: string; // brand SVG in /public/icons
};

export const SOCIALS: Social[] = [
  {
    key: "instagram",
    name: "Instagram",
    handle: "@aromaperfumeriacr",
    description: "Descubre nuestras notas exclusivas y novedades.",
    url: CONTACT.instagram,
    icon: "/icons/instagram.svg",
  },
  {
    key: "facebook",
    name: "Facebook",
    handle: "Aroma Perfumería CR",
    description: "Síguenos para conocer nuestras promociones y feed.",
    url: CONTACT.facebook,
    icon: "/icons/facebook.svg",
  },
  {
    key: "whatsapp",
    name: "WhatsApp",
    handle: "Soporte directo",
    description: "Chatea con nosotros para soporte inmediato.",
    url: CONTACT.whatsapp,
    icon: "/icons/whatsapp.svg",
  },
];
