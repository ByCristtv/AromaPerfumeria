import { CONTACT } from "@/components/contact/contactData";

/**
 * Canonical site identity — one place for everything search engines and social
 * scrapers read.
 *
 * `siteUrl` is the linchpin: Next needs an absolute origin to resolve canonical
 * URLs, OpenGraph images, and sitemap entries. Without `metadataBase` set from
 * it, Next emits relative OG image paths, which every social scraper rejects.
 */
export const SITE = {
  name: "Aroma Perfumería",
  /** Used in <title> templates. Kept short so titles don't get truncated in SERPs. */
  shortName: "Aroma",
  description:
    "Perfumería de lujo en Costa Rica. Fragancias originales, nicho y de diseñador, además de decants. Envío a todo el país y pago seguro con tarjeta o SINPE Móvil.",
  locale: "es_CR",
  lang: "es-CR",
  country: "CR",
  currency: "CRC",
  social: {
    instagram: CONTACT.instagram,
    facebook: CONTACT.facebook,
    tiktok: CONTACT.tiktok,
    whatsapp: CONTACT.whatsapp,
  },
} as const;

/**
 * Absolute origin, no trailing slash.
 *
 * Falls back to localhost in development so `metadataBase` is never undefined —
 * an undefined base silently downgrades every canonical and OG image to a
 * relative path, which is the single most common Next SEO bug.
 *
 * ⚠ NEXT_PUBLIC_APP_URL must be set to the real production origin before deploy.
 */
export function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000");

  return raw.replace(/\/+$/, "");
}

/** Build an absolute URL for a site-relative path. */
export function absoluteUrl(path: string): string {
  return `${getSiteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Routes that must never be indexed: private account areas, transactional
 * funnels, and the admin panel. Kept here so `robots.ts` and per-route metadata
 * can't drift apart.
 */
export const NON_INDEXABLE_PATHS = [
  "/admin",
  "/api",
  "/auth",
  "/cart",
  "/checkout",
  "/login",
  "/orders",
  "/profile",
  "/register",
] as const;
