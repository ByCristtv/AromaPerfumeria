import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/footer/Footer";
import FooterGate from "@/components/layout/footer/FooterGate";
import QueryProvider from "@/components/providers/QueryProvider";
import AuthListener from "@/components/auth/AuthListener";
import JsonLd from "@/components/seo/JsonLd";
import { organizationSchema, webSiteSchema } from "@/lib/seo/jsonLd";
import { SITE, getSiteUrl } from "@/lib/seo/site";

export const metadata: Metadata = {
  /**
   * The single most important line for SEO in this file. Without it Next emits
   * RELATIVE canonical and OpenGraph URLs, which social scrapers reject outright
   * and which make `alternates.canonical` meaningless.
   */
  metadataBase: new URL(getSiteUrl()),

  title: {
    // Page titles become "Catálogo · Aroma Perfumería" automatically.
    default: `${SITE.name} — Perfumes originales en Costa Rica`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,

  // Home page is the canonical root; every other route sets its own.
  alternates: { canonical: "/" },

  /*
   * Deliberately NO `title`/`description` here.
   *
   * Child routes inherit the parent's `openGraph` object wholesale, so pinning a
   * title at the root made every page share the generic one — /about and
   * /howtobuy were advertising the home page when shared. Omitting it lets Next
   * fall back to each route's own `title`/`description`, while siteName, locale
   * and type still inherit as intended.
   */
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: SITE.locale,
    url: "/",
  },

  twitter: {
    card: "summary_large_image",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      // Allow full rich previews — the default caps snippet/image size.
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  formatDetection: { telephone: false, address: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // lang is es-CR: regional targeting matters for a CR-only storefront.
    <html lang={SITE.lang} className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {/* Site-wide entity graph. Server-rendered so non-JS crawlers see it. */}
        <JsonLd data={[organizationSchema(), webSiteSchema()]} />

        <QueryProvider>
          <AuthListener />
          <Navbar />
          <main className="flex-1">{children}</main>
          <FooterGate>
            <Footer />
          </FooterGate>
        </QueryProvider>
      </body>
    </html>
  );
}
