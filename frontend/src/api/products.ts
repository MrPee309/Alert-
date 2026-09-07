/**
 * DealLakay PRODUCTS API — read-only product detail (public endpoint,
 * GET /products/{slug}). Used to enrich a notification's detail view when
 * its link points to a product, with the product's real image/price/seller
 * — DealLakay's notification objects don't carry that data themselves, only
 * a message string and a link path.
 */
import { apiClient } from "./client";

export interface DealLakayProduct {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  quantity: number;
  condition: string;
  department: string;
  city: string;
  category: string;
  images: string[];
  status: string;
}

export interface DealLakaySeller {
  id: string;
  full_name: string;
  username: string;
  avatar: string;
  store_name: string | null;
  seller_verified: boolean | null;
  rating: number;
}

export interface ProductDetailResponse {
  product: DealLakayProduct;
  seller: DealLakaySeller | null;
  is_favorite: boolean;
}

export const productsApi = {
  get: (identifier: string) => apiClient.get<ProductDetailResponse>(`/products/${identifier}`, false),
};
