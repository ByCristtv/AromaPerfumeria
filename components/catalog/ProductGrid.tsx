import ProductCard from "@/components/product/ProductCard";
import type { ProductCardData } from "@/types/product";

/**
 * Responsive showroom grid: 2 cols on mobile, 3 on tablet, 4 on desktop.
 * Server component — each card hydrates independently.
 */
export default function ProductGrid({ products }: { products: ProductCardData[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
