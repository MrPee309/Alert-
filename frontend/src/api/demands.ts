/**
 * DealLakay "Demands" API — real integration with DealLakay's existing
 * "Request a Part" system (routers/requests.py). This is intentionally NOT a
 * separate demand/wanted-post system — it reuses the same backend collection
 * DealLakay's website already uses, mapped into this app's `Demand` shape.
 *
 * NOTE: DealLakay's Request a Part has no quantity/budget/urgency fields —
 * only title, description, category, department, city, images. Those extra
 * concepts from the app's original design do not exist on the real backend.
 */
import { apiClient } from "./client";
import type { CreateDemandInput, Demand } from "@/src/types";

interface DealLakayRequest {
  id: string;
  user_id: string;
  username: string;
  title: string;
  description: string;
  category: string | null;
  department: string;
  city: string;
  images: string[];
  status: string;
  offer_count: number;
  created_at: string;
}

function mapDemand(r: DealLakayRequest): Demand {
  return {
    id: r.id,
    userId: r.user_id,
    username: r.username,
    title: r.title,
    categoryId: r.category,
    description: r.description,
    images: r.images || [],
    department: r.department,
    city: r.city,
    status: (r.status as Demand["status"]) || "open",
    responsesCount: r.offer_count,
    createdAt: r.created_at,
  };
}

export const demandsApi = {
  // POST /requests
  createDemand: async (input: CreateDemandInput): Promise<Demand> => {
    const r = await apiClient.post<DealLakayRequest>("/requests", {
      title: input.title,
      description: input.description,
      category: input.categoryId,
      department: input.department,
      city: input.city,
      images: input.images || [],
    });
    return mapDemand(r);
  },

  // GET /requests/my
  getMyDemands: async (): Promise<Demand[]> => {
    const list = await apiClient.get<DealLakayRequest[]>("/requests/my");
    return list.map(mapDemand);
  },

  // GET /requests/{id}  ->  { request, offers, is_owner }
  getDemand: async (id: string): Promise<Demand> => {
    const res = await apiClient.get<{ request: DealLakayRequest }>(`/requests/${id}`);
    return mapDemand(res.request);
  },

  // PUT /requests/{id}/close
  closeDemand: (id: string) => apiClient.put<{ message: string }>(`/requests/${id}/close`),

  // DELETE /requests/{id}
  deleteDemand: (id: string) => apiClient.delete<{ message: string }>(`/requests/${id}`),
};
