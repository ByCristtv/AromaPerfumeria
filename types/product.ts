import { ProductTypes } from "./database";

export type Product = {
  id: string; // uuid

  name: string;
  slug: string;
  brand_id: string; // uuid (FK)
  description: string;
  product_type: ProductTypes;
  // ajusta según tu enum real en Supabase
  size_ml: number;
  price: number;
  is_on_offer: boolean;
  offer_price: number | null;
  stock: number;
  is_active: boolean;
  created_at: string; // ISO date
  updated_at: string;
};
export type ProductWithBrand = Product & {
  brand: {
    id: string;
    name: string;
  };
};

export type ProductWithImage = ProductWithBrand & {
  image_url: string;
};

export type ProductPreview = {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url: string;
  brand?: string;
  categories?: {
    name: string;
  }[];
};

export interface ProductCardData {
  id: string;
  name: string;
  slug: string;
  gender: 'masculine' | 'feminine' | 'unisex';
  concentration: string;
  brands: { name: string };
  // La variante que marcamos como principal en la DB
  featured_variant: {
    price: number;
    offer_price: number | null;
    is_on_offer: boolean;
    stock: number;
    size_ml: number;
  } | null;
  // Array de imágenes
  product_images: {
    url: string;
    position: number;
  }[];
}


// INTERFACES PARA TIPADO
export interface CreateProductDTO {
  // Producto Base
  name: string
  brand_id: string
  description: string
  notes_top: string
  notes_middle: string
  notes_base: string
  gender: string
  concentration: string
  category_ids: string[]
  file: File
  // Variante Inicial
  sku: string
  price: number
  stock: number
  size_ml: number
  product_type: ProductTypes
  is_on_offer: boolean
  offer_price: number | null
}

export interface CreateVariantDTO {
  product_id: string
  sku: string
  price: number
  stock: number
  size_ml: number
  product_type: ProductTypes
  is_on_offer: boolean
  offer_price: number | null
}
