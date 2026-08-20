/**
 * DealLakay ALERTS/NOTIFICATIONS API — endpoint mapping (INTEGRATION PLACEHOLDER).
 * TODO(DealLakay): map to real endpoints.
 */
import { apiClient } from "./client";
import type { AppNotification } from "@/src/types";

export const alertsApi = {
  // GET /notifications
  getNotifications: () => apiClient.get<AppNotification[]>("/notifications"),

  // PATCH /notifications/:id/read
  markRead: (id: string) =>
    apiClient.patch<AppNotification>(`/notifications/${id}/read`, {}),

  // POST /notifications/read-all
  markAllRead: () => apiClient.post<void>("/notifications/read-all"),
};
