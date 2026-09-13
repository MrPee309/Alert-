/**
 * DealLakay "NOTIFY ME" API (mobile) — Phase 8. Reuses the existing
 * notification infrastructure server-side; this is a thin subscription
 * layer, not a separate notification system.
 */
import { apiClient } from "./client";

export type NotifyMeKind = "product" | "technician" | "transport";

export interface NotifyMeInput {
  kind: NotifyMeKind;
  category?: string;
  specialty?: string;
  city?: string;
}

export const notifyMeApi = {
  subscribe: (data: NotifyMeInput) =>
    apiClient.post<{ message: string; id: string }>("/notify-me", data),
};
