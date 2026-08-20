/**
 * Alert / notification service. In mock mode, notifications are stored on-device
 * and seeded once with a welcome message. Real push notifications are delivered
 * separately via push-service.ts + the backend relay.
 */
import { USE_MOCK } from "@/src/constants/config";
import { alertsApi } from "@/src/api/alerts";
import { storage } from "@/src/utils/storage";
import { KEYS, genId, mockDelay, readList, writeList } from "./mock-db";
import type { AppNotification, NotificationType } from "@/src/types";

async function ensureSeed(): Promise<void> {
  const seeded = await storage.getItem<boolean>(KEYS.seeded, false);
  if (seeded) return;
  const welcome: AppNotification = {
    id: genId("ntf"),
    type: "SYSTEM",
    title: "Byenvini nan DealLakay Alert 🔔",
    message: "Fè premye demand ou epi n ap avèti w lè gen repons.",
    createdAt: new Date().toISOString(),
    read: false,
    demandId: null,
  };
  await writeList(KEYS.notifications, [welcome]);
  await storage.setItem(KEYS.seeded, true);
}

export const alertService = {
  async getNotifications(): Promise<AppNotification[]> {
    if (!USE_MOCK) return alertsApi.getNotifications();
    await ensureSeed();
    await mockDelay(250);
    const list = await readList<AppNotification>(KEYS.notifications);
    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  async unreadCount(): Promise<number> {
    if (!USE_MOCK) {
      const list = await alertsApi.getNotifications();
      return list.filter((n) => !n.read).length;
    }
    await ensureSeed();
    const list = await readList<AppNotification>(KEYS.notifications);
    return list.filter((n) => !n.read).length;
  },

  async markRead(id: string): Promise<void> {
    if (!USE_MOCK) {
      await alertsApi.markRead(id);
      return;
    }
    const list = await readList<AppNotification>(KEYS.notifications);
    await writeList(
      KEYS.notifications,
      list.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  },

  async markAllRead(): Promise<void> {
    if (!USE_MOCK) {
      await alertsApi.markAllRead();
      return;
    }
    const list = await readList<AppNotification>(KEYS.notifications);
    await writeList(
      KEYS.notifications,
      list.map((n) => ({ ...n, read: true })),
    );
  },

  /** Local-only: add an in-app notification (used by the demand lifecycle). */
  async addNotification(input: {
    type: NotificationType;
    title: string;
    message: string;
    demandId?: string | null;
  }): Promise<void> {
    if (!USE_MOCK) return; // real notifications are server-generated
    const list = await readList<AppNotification>(KEYS.notifications);
    const notif: AppNotification = {
      id: genId("ntf"),
      type: input.type,
      title: input.title,
      message: input.message,
      createdAt: new Date().toISOString(),
      read: false,
      demandId: input.demandId ?? null,
    };
    await writeList(KEYS.notifications, [notif, ...list]);
  },
};
