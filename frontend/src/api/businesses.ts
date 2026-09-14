/**
 * DealLakay LOCAL BUSINESS API (mobile) — reuses the EXISTING
 * GET /businesses endpoint the website's Business system already has
 * (backend/routers/businesses.py). No new backend, no duplicate.
 */
import { apiClient } from "./client";

export interface DealLakayBusiness {
  id: string;
  business_type: string;
  business_name: string;
  description: string;
  phone: string;
  department: string;
  city: string;
  area: string;
  photos: string[];
  rating: number;
  review_count: number;
}

export interface BusinessListResponse {
  businesses: DealLakayBusiness[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface BusinessListParams {
  q?: string;
  business_type?: string;
  department?: string;
  city?: string;
  page?: number;
}

export const businessesApi = {
  list: (params: BusinessListParams = {}) => {
    const qs = new URLSearchParams();
    if (params.q) qs.set("q", params.q);
    if (params.business_type) qs.set("business_type", params.business_type);
    if (params.department) qs.set("department", params.department);
    if (params.city) qs.set("city", params.city);
    if (params.page) qs.set("page", String(params.page));
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return apiClient.get<BusinessListResponse>(`/businesses${suffix}`, false);
  },

  get: (id: string) => apiClient.get<DealLakayBusiness>(`/businesses/${id}`, false),

  types: () => apiClient.get<string[]>("/business-types", false),
};
