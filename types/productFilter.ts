
import { ProductCardData } from "./product";

export interface ProductFiltersProps {
  selectedCategory?: string;
  onCategoryChange: (category: string) => void;
}

export type ProductOrderBy = "price_asc" | "price_desc" | "name_asc" | "name_desc";

export interface ProductFilterOrderByProps {
  selectedOrder: ProductOrderBy;
  onOrderChange: (order: ProductOrderBy) => void;
}

export interface ProductListProps {
  products: ProductCardData[];
  isLoading: boolean;
}

