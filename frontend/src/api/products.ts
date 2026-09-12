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

export interface ProductListResponse {
  products: DealLakayProduct[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ProductListParams {
  q?: string;
  category?: string;
  city?: string;
  sort?: string;
  page?: number;
}

export const productsApi = {
  get: (identifier: string) => apiClient.get<ProductDetailResponse>(`/products/${identifier}`, false),

  list: (params: ProductListParams = {}) => {
    const qs = new URLSearchParams();
    if (params.q) qs.set("q", params.q);
    if (params.category) qs.set("category", params.category);
    if (params.city) qs.set("city", params.city);
    if (params.sort) qs.set("sort", params.sort);
    if (params.page) qs.set("page", String(params.page));
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return apiClient.get<ProductListResponse>(`/products${suffix}`, false);
  },
};
