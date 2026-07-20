import { SITE, absoluteUrl, getSiteUrl } from "./site";

/**
 * JSON-LD builders for schema.org structured data.
 *
 * Structured data is what turns a plain blue link into a rich result — price,
 * availability and rating shown directly in Google. For an e-commerce site the
 * Product graph is the single highest-value SEO addition, and none existed here.
 *
 * Everything returns a plain object; render it with `<JsonLd data={...} />`.
 */

/** Loosely typed JSON-LD node — schema.org shapes are open-ended by design. */
export type JsonLdNode = Record<string, unknown>;

/** Identity of the business itself. Emitted once, site-wide. */
export function organizationSchema(): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "Store",
    "@id": `${getSiteUrl()}/#organization`,
    name: SITE.name,
    description: SITE.description,
    url: getSiteUrl(),
    image: absoluteUrl("/opengraph-image"),
    areaServed: { "@type": "Country", name: "Costa Rica" },
    address: { "@type": "PostalAddress", addressCountry: SITE.country },
    // Links the site to its verified social profiles — helps entity resolution.
    sameAs: [
      SITE.social.instagram,
      SITE.social.facebook,
      SITE.social.tiktok,
    ],
  };
}

/** Site-level node that enables the sitelinks search box. */
export function webSiteSchema(): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${getSiteUrl()}/#website`,
    name: SITE.name,
    url: getSiteUrl(),
    inLanguage: SITE.lang,
    publisher: { "@id": `${getSiteUrl()}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: absoluteUrl("/products?q={search_term_string}"),
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export interface ProductOfferInput {
  sku: string;
  price: number;
  /** Whether this variant can actually be bought right now. */
  inStock: boolean;
  /** Human label for the variant, e.g. "100 ml". */
  name?: string;
}

export interface ProductSchemaInput {
  name: string;
  slug: string;
  description?: string | null;
  brand?: string | null;
  images: string[];
  offers: ProductOfferInput[];
}

/**
 * Product schema with an `AggregateOffer` across variants.
 *
 * Google requires `offers` to be present and internally consistent with the
 * visible page — the low/high range is computed from the real variant prices
 * rather than hardcoded, so it can't drift when pricing changes.
 */
export function productSchema(input: ProductSchemaInput): JsonLdNode {
  const url = absoluteUrl(`/products/${input.slug}`);
  const prices = input.offers.map((o) => o.price);
  const anyInStock = input.offers.some((o) => o.inStock);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: input.name,
    description: input.description ?? undefined,
    image: input.images.length > 0 ? input.images : undefined,
    url,
    ...(input.brand && {
      brand: { "@type": "Brand", name: input.brand },
    }),
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: SITE.currency,
      lowPrice: Math.min(...prices),
      highPrice: Math.max(...prices),
      offerCount: input.offers.length,
      availability: anyInStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: { "@id": `${getSiteUrl()}/#organization` },
    },
  };
}

/** Breadcrumb trail — renders the hierarchy under the SERP title. */
export function breadcrumbSchema(
  crumbs: Array<{ name: string; path: string }>
): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}
