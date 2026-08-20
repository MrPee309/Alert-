/**
 * On-device mock persistence used by the service layer while the real DealLakay
 * API is not connected (config.USE_MOCK). Backed by AsyncStorage via the shared
 * storage util. Clearly separated so it can be deleted once the API is live.
 */
import { storage } from "@/src/utils/storage";

export const KEYS = {
  demands: "dla.mock.demands",
  notifications: "dla.mock.notifications",
  seeded: "dla.mock.seeded",
  demandDraft: "dla.demand.draft",
} as const;

/** Small artificial latency so loading states are visible & realistic. */
export const mockDelay = (ms = 350) => new Promise((r) => setTimeout(r, ms));

export function genId(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export async function readList<T>(key: string): Promise<T[]> {
  const raw = await storage.getItem<string>(key, "[]");
  try {
    const parsed = JSON.parse(raw ?? "[]");
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export async function writeList<T>(key: string, list: T[]): Promise<void> {
  await storage.setItem(key, JSON.stringify(list));
}
