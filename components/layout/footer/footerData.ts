import { CONTACT } from "@/components/contact/contactData";

/**
 * Single source of truth for footer content.
 *
 * Contact URLs are reused from the canonical `CONTACT` map (contactData.ts).
 * Values marked PLACEHOLDER below do not yet exist anywhere in the project —
 * replace them with the real ones when available (they are intentionally not
 * invented as authoritative).
 */

export const BRAND_STATEMENT =
  "Aroma Perfumería nace de la pasión por las fragancias excepcionales. Ofrecemos perfumes originales, decants premium y una experiencia de compra diseñada para quienes valoran la autenticidad, la calidad y el lujo.";

// ---- Contact (Column 4) ----
export const FOOTER_CONTACT = {
  // PLACEHOLDER — no support email is configured in the project yet.
  email: "contacto@aromaperfumeria.cr",
  whatsappUrl: CONTACT.whatsapp,
  whatsappDisplay: "+506 7138 7812",
  // PLACEHOLDER — confirm real business hours.
  hours: "Lunes a Sábado · 9:00 AM – 6:00 PM",
  location: "Costa Rica",
} as const;

// ---- Social channels (Column 1). Only configured accounts are shown. ----
export const FOOTER_SOCIALS = [
  { name: "Instagram", url: CONTACT.instagram, icon: "/icons/instagram.svg" },
  { name: "Facebook", url: CONTACT.facebook, icon: "/icons/facebook.svg" },
  { name: "WhatsApp", url: CONTACT.whatsapp, icon: "/icons/whatsapp.svg" },
  { name: "TikTok", url: CONTACT.tiktok, icon: "/icons/TikTok.svg" },
] as const;

type FooterLink = { label: string; href: string };

// ---- Column 2 — Tienda ----
// Links map to real destinations; filter-backed ones use catalog query params.
export const SHOP_LINKS: FooterLink[] = [
  { label: "Catálogo Completo", href: "/products" },
  { label: "Nuevos Ingresos", href: "/" },
];

// ---- Column 3 — Información ----
export const INFO_LINKS: FooterLink[] = [
  { label: "Sobre Nosotros", href: "/about" },
  { label: "Contacto", href: "/contact" },
  { label: "Preguntas Frecuentes", href: "/contact" },
  { label: "Métodos de Pago", href: "/howtobuy" },
  { label: "Envíos", href: "/howtobuy" },
  { label: "Política de Privacidad", href: "/legal/privacidad" },
  { label: "Términos y Condiciones", href: "/legal/terminos" },
];

// ---- Trust indicators (Column 4) ----
export const TRUST_INDICATORS = [
  "Perfumes 100% Originales",
  "Pagos Seguros",
  "Envíos Nacionales",
  "Atención Personalizada",
] as const;

// ---- Accepted payment methods (Section 6) ----
export const PAYMENT_METHODS = [
  "Visa",
  "Mastercard",
  "Amex",
  "SINPE Móvil",
] as const;
