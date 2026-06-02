import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug } from "@/features/products/getProductBySlug";
import { getRelatedProducts } from "@/features/products/getRelatedProducts";
import ProductDetailView from "@/components/product/detail/ProductDetailView";

interface ProductPageProps {
  // Next.js 16: params/searchParams are async.
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: "Producto no encontrado — Aroma Perfumería" };
  }

  const brand = product.brands?.name ?? "";
  return {
    title: `${product.name}${brand ? ` · ${brand}` : ""} — Aroma Perfumería`,
    description:
      product.description?.slice(0, 160) ??
      `${brand} ${product.name} — ${product.concentration}. Disponible en Aroma Perfumería.`,
    openGraph: {
      title: `${product.name}${brand ? ` · ${brand}` : ""}`,
      images: product.product_images[0]?.url
        ? [product.product_images[0].url]
        : undefined,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product || product.product_variants.length === 0) {
    notFound();
  }

  const related = await getRelatedProducts(
    product.id,
    product.categories.map((c) => c.id),
    4
  );

  return <ProductDetailView product={product} related={related} />;
}
