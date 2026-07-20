import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug } from "@/features/products/getProductBySlug";
import { getRelatedProducts } from "@/features/products/getRelatedProducts";
import ProductDetailView from "@/components/product/detail/ProductDetailView";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbSchema, productSchema } from "@/lib/seo/jsonLd";
import { SITE } from "@/lib/seo/site";
import type { ProductDetailData } from "@/types/product";

interface ProductPageProps {
  // Next.js 16: params/searchParams are async.
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ variant?: string }>;
}

/** Meta descriptions are truncated around 160 chars; end on a word boundary. */
function toMetaDescription(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

function describeProduct(product: ProductDetailData): string {
  const brand = product.brands?.name ?? "";
  if (product.description) return toMetaDescription(product.description);

  return toMetaDescription(
    `${brand} ${product.name} — ${product.concentration}. Fragancia original disponible en ${SITE.name}, con envío a todo Costa Rica.`
  );
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    // Keep the 404 out of the index.
    return {
      title: "Producto no encontrado",
      robots: { index: false, follow: true },
    };
  }

  const brand = product.brands?.name ?? "";
  const title = `${product.name}${brand ? ` · ${brand}` : ""}`;
  const description = describeProduct(product);
  const images = product.product_images
    .slice(0, 4)
    .map((image) => image.url)
    .filter(Boolean);
  const canonical = `/products/${product.slug}`;

  return {
    title,
    description,
    // Variant selection uses ?variant=… — without an explicit canonical each
    // variant URL would be indexed as a separate, near-duplicate page.
    alternates: { canonical },
    openGraph: {
      type: "website",
      url: canonical,
      title,
      description,
      siteName: SITE.name,
      locale: SITE.locale,
      images: images.length > 0 ? images : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: images.length > 0 ? images : undefined,
    },
  };
}

export default async function ProductPage({
  params,
  searchParams,
}: ProductPageProps) {
  const { slug } = await params;
  const { variant: initialVariantId } = await searchParams;
  const product = await getProductBySlug(slug);

  if (!product || product.product_variants.length === 0) {
    notFound();
  }

  const related = await getRelatedProducts(
    product.id,
    product.categories.map((c) => c.id),
    4
  );

  // Prices mirror what the page actually charges: an offer price wins when the
  // offer is live. Structured data that disagrees with the visible price is a
  // manual-action risk, not just a missed opportunity.
  const offers = product.product_variants.map((variant) => ({
    sku: variant.id,
    price:
      variant.is_on_offer && variant.offer_price != null
        ? variant.offer_price
        : variant.price,
    inStock: variant.stock > 0,
    name: `${variant.size_ml} ml`,
  }));

  return (
    <>
      <JsonLd
        data={[
          productSchema({
            name: product.name,
            slug: product.slug,
            description: product.description,
            brand: product.brands?.name ?? null,
            images: product.product_images.map((image) => image.url),
            offers,
          }),
          breadcrumbSchema([
            { name: "Inicio", path: "/" },
            { name: "Catálogo", path: "/products" },
            { name: product.name, path: `/products/${product.slug}` },
          ]),
        ]}
      />

      <ProductDetailView
        product={product}
        related={related}
        initialVariantId={initialVariantId}
      />
    </>
  );
}
