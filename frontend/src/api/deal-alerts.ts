/**
 * DealLakay DEAL ALERTS API — real integration with routers/alerts.py
 * (deal_alerts collection). Distinct from src/api/alerts.ts, which handles
 * NOTIFICATIONS — two different DealLakay systems that happen to share the
 * word "alert" in casual language.
 *
 * Two alert types: DEMAND ("I'm looking for X") and OFFER ("I have X
 * available"). Only technicians/sellers may create OFFER — enforced by the
 * backend, not just this client.
 */
import { apiClient } from "./client";

export type AlertType = "DEMAND" | "OFFER";

export interface DealAlert {
  id: string;
  user_id: string;
  alert_type: AlertType;
  keyword: string | null;
  category: string | null;
  subcategory: string | null;
  brand: string | null;
  model: string | null;
  quantity: number | null;
  condition: string | null;
  description: string | null;
  department: string | null;
  city: string | null;
  max_price: number | null;
  price: number | null;
  active: boolean;
  created_at: string;
  // Only present on /alerts/discover results (community alerts from others).
  creator_name?: string;
  creator_role?: string;
}

export interface CreateDealAlertInput {
  alert_type: AlertType;
  keyword?: string | null;
  category?: string | null;
  subcategory?: string | null;
  brand?: string | null;
  model?: string | null;
  quantity?: number | null;
  condition?: string | null;
  description?: string | null;
  department?: string | null;
  city?: string | null;
  max_price?: number | null;
  price?: number | null;
}

export interface DiscoverFilters {
  category?: string;
  department?: string;
  alertType?: AlertType;
}

export interface AlertResponse {
  id: string;
  alert_id: string;
  responder_id: string;
  responder_username: string;
  responder_name: string;
  message: string;
  price: number | null;
  quantity: number | null;
  created_at: string;
}

export interface RespondToDemandInput {
  message: string;
  price?: number | null;
  quantity?: number | null;
}

export const dealAlertsApi = {
  list: () => apiClient.get<DealAlert[]>("/alerts"),
  create: (input: CreateDealAlertInput) => apiClient.post<DealAlert>("/alerts", input),
  update: (id: string, input: CreateDealAlertInput) => apiClient.put<{ message: string }>(`/alerts/${id}`, input),
  toggle: (id: string) => apiClient.put<{ message: string }>(`/alerts/${id}/toggle`),
  remove: (id: string) => apiClient.delete<{ message: string }>(`/alerts/${id}`),

  // POST /alerts/{aid}/respond — a structured response to someone else's
  // DEMAND, distinct from just opening a Messenger chat: it's tied to the
  // specific alert and the requester sees every response received.
  respond: (alertId: string, input: RespondToDemandInput) =>
    apiClient.post<AlertResponse>(`/alerts/${alertId}/respond`, input),

  // GET /alerts/{aid}/responses — only the alert's own creator can call this.
  getResponses: (alertId: string) => apiClient.get<AlertResponse[]>(`/alerts/${alertId}/responses`),

  // GET /alerts/discover — community alerts from OTHER users. Backend
  // enforces who gets a non-empty result (basic clients get []).
  discover: (filters: DiscoverFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.category) params.set("category", filters.category);
    if (filters.department) params.set("department", filters.department);
    if (filters.alertType) params.set("alert_type", filters.alertType);
    const qs = params.toString();
    return apiClient.get<DealAlert[]>(`/alerts/discover${qs ? `?${qs}` : ""}`);
  },
};
