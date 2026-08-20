/**
 * DealLakay DEMANDS + MATCHING API — endpoint mapping (INTEGRATION PLACEHOLDER).
 *
 * These are the clean service function signatures the app is built around:
 *   createDemand, getMyDemands, getDemand, getDemandMatches, respondToDemand.
 * TODO(DealLakay): map to real endpoints and response shapes.
 */
import { apiClient } from "./client";
import type {
  CreateDemandInput,
  Demand,
  DemandResponse,
} from "@/src/types";

export const demandsApi = {
  // POST /demands
  createDemand: (input: CreateDemandInput) =>
    apiClient.post<Demand>("/demands", input),

  // GET /demands/mine
  getMyDemands: () => apiClient.get<Demand[]>("/demands/mine"),

  // GET /demands/:id
  getDemand: (id: string) => apiClient.get<Demand>(`/demands/${id}`),

  // GET /demands/:id/matches  (vendors/technicians that responded)
  getDemandMatches: (id: string) =>
    apiClient.get<DemandResponse[]>(`/demands/${id}/matches`),

  // POST /demands/:id/respond  (used by vendor apps later)
  respondToDemand: (id: string, message: string, price: number | null) =>
    apiClient.post<DemandResponse>(`/demands/${id}/respond`, { message, price }),

  // PATCH /demands/:id  (e.g. cancel)
  updateDemand: (id: string, patch: Partial<Demand>) =>
    apiClient.patch<Demand>(`/demands/${id}`, patch),
};
