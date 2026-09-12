/**
 * DealLakay TECHNICIANS API (mobile) — read-only public browse/search,
 * reusing the EXISTING GET /technicians endpoint the website already uses.
 * No new backend, no duplicate technician directory.
 */
import { apiClient } from "./client";

export interface DealLakayTechnician {
  username: string;
  full_name: string;
  avatar: string;
  city: string | null;
  department: string | null;
  specialties: string[];
  technician_verified: boolean;
  rating: number;
  review_count: number;
}

export interface TechnicianListResponse {
  technicians: DealLakayTechnician[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface TechnicianListParams {
  q?: string;
  specialty?: string;
  city?: string;
  sort?: string;
  page?: number;
}

export const techniciansApi = {
  list: (params: TechnicianListParams = {}) => {
    const qs = new URLSearchParams();
    if (params.q) qs.set("q", params.q);
    if (params.specialty) qs.set("specialty", params.specialty);
    if (params.city) qs.set("city", params.city);
    if (params.sort) qs.set("sort", params.sort);
    if (params.page) qs.set("page", String(params.page));
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return apiClient.get<TechnicianListResponse>(`/technicians${suffix}`, false);
  },
};
