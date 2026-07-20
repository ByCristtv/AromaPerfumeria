import type { MetadataRoute } from "next";
import { NON_INDEXABLE_PATHS, absoluteUrl } from "@/lib/seo/site";

/**
 * Served at /robots.txt.
 *
 * Disallow covers private account areas, the transactional funnel, and the admin
 * panel — sourced from NON_INDEXABLE_PATHS so it can never drift from the
 * per-route `robots` metadata.
 *
 * Note this is a crawl directive, not an access control: /admin is protected by
 * proxy redirects, RLS, and `is_admin()` guards in the RPCs. robots.txt only
 * stops well-behaved crawlers from wasting budget on pages they can't use.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: NON_INDEXABLE_PATHS.map((path) => `${path}/`),
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
