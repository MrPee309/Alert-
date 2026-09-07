/**
 * DealLakay NOTIFICATIONS API — real integration with the DealLakay
 * notifications system (routers/social.py) — the exact events this mobile
 * app's push-registered device receives are stored here (see backend
 * shared.py::create_notification, which also triggers push).
 */
import { apiClient } from "./client";
import type { AppNotification } from "@/src/types";

interface DealLakayNotification {
  id: string;
  type: string;
  message: string;
  link: string;
  read: boolean;
  created_at: string;
}

function mapNotification(n: DealLakayNotification): AppNotification {
  return {
    id: n.id,
    type: n.type,
    title: "DealLakay",
    message: n.message,
    createdAt: n.created_at,
    read: n.read,
    demandId: n.link?.startsWith("/requests/") ? n.link.split("/requests/")[1] : null,
    link: n.link,
  };
}

export const alertsApi = {
  // GET /notifications  ->  { notifications, unread }
  getNotifications: async (): Promise<AppNotification[]> => {
    const res = await apiClient.get<{ notifications: DealLakayNotification[]; unread: number }>("/notifications");
    return res.notifications.map(mapNotification);
  },

  // POST /notifications/{id}/read
  markRead: (id: string) => apiClient.post<{ message: string }>(`/notifications/${id}/read`, {}),

  // POST /notifications/read-all
  markAllRead: () => apiClient.post<{ message: string }>("/notifications/read-all"),
};
