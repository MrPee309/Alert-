/**
 * Demand service — clean interface for the demand lifecycle & matching.
 *   createDemand · getMyDemands · getDemand · getDemandMatches · respondToDemand
 *
 * MOCK behavior (USE_MOCK): demands persist on-device. Matching returns an EMPTY
 * list on purpose — we never fabricate vendor responses. The UI shows the
 * "Nou ap chèche moun ki ka ede w..." empty state until the real DealLakay
 * matching API is connected.
 */
import { USE_MOCK } from "@/src/constants/config";
import { demandsApi } from "@/src/api/demands";
import { storage } from "@/src/utils/storage";
import { KEYS, genId, mockDelay, readList, writeList } from "./mock-db";
import { alertService } from "./alert-service";
import type {
  CreateDemandInput,
  Demand,
  DemandResponse,
} from "@/src/types";

function computeExpiry(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

/** Auto-expire demands whose alert window has passed (mock lifecycle). */
function applyLifecycle(demands: Demand[]): { list: Demand[]; changed: boolean } {
  const now = Date.now();
  let changed = false;
  const list = demands.map((d) => {
    if (
      new Date(d.expiresAt).getTime() < now &&
      d.status !== "EXPIRED" &&
      d.status !== "COMPLETED" &&
      d.status !== "CANCELLED"
    ) {
      changed = true;
      return { ...d, status: "EXPIRED" as const };
    }
    return d;
  });
  return { list, changed };
}

export const demandService = {
  async createDemand(input: CreateDemandInput, userId: string): Promise<Demand> {
    if (!USE_MOCK) return demandsApi.createDemand(input);
    await mockDelay();
    const now = new Date().toISOString();
    const demand: Demand = {
      id: genId("dmd"),
      userId,
      title: input.title.trim(),
      categoryId: input.categoryId,
      description: input.description.trim(),
      photoUri: input.photoUri ?? null,
      quantity: input.quantity,
      budgetMin: input.budgetMin,
      budgetMax: input.budgetMax,
      currency: "HTG",
      locationId: input.locationId,
      urgency: input.urgency,
      alertDurationDays: input.alertDurationDays,
      status: "MATCHING",
      responsesCount: 0,
      createdAt: now,
      expiresAt: computeExpiry(input.alertDurationDays),
    };
    const list = await readList<Demand>(KEYS.demands);
    await writeList(KEYS.demands, [demand, ...list]);

    // Local system alert acknowledging the new demand.
    await alertService.addNotification({
      type: "SYSTEM",
      title: "Demand aktive",
      message: `“${demand.title}” aktive. N ap chèche moun ki ka ede w.`,
      demandId: demand.id,
    });

    return demand;
  },

  async getMyDemands(userId: string): Promise<Demand[]> {
    if (!USE_MOCK) return demandsApi.getMyDemands();
    await mockDelay();
    const all = await readList<Demand>(KEYS.demands);
    const { list, changed } = applyLifecycle(all);
    if (changed) await writeList(KEYS.demands, list);
    return list.filter((d) => d.userId === userId);
  },

  async getDemand(id: string): Promise<Demand | null> {
    if (!USE_MOCK) return demandsApi.getDemand(id);
    await mockDelay(250);
    const all = await readList<Demand>(KEYS.demands);
    const { list, changed } = applyLifecycle(all);
    if (changed) await writeList(KEYS.demands, list);
    return list.find((d) => d.id === id) ?? null;
  },

  async getDemandMatches(id: string): Promise<DemandResponse[]> {
    if (!USE_MOCK) return demandsApi.getDemandMatches(id);
    await mockDelay(250);
    // Intentionally empty — real matches come from the DealLakay matching API.
    return [];
  },

  async respondToDemand(): Promise<never> {
    // Vendor-side action; belongs to a future vendor app / real API.
    throw new Error("respondToDemand is handled by the DealLakay backend.");
  },

  async cancelDemand(id: string): Promise<void> {
    if (!USE_MOCK) {
      await demandsApi.updateDemand(id, { status: "CANCELLED" });
      return;
    }
    await mockDelay(200);
    const all = await readList<Demand>(KEYS.demands);
    await writeList(
      KEYS.demands,
      all.map((d) => (d.id === id ? { ...d, status: "CANCELLED" as const } : d)),
    );
  },

  // --- Offline draft (never lose an unfinished demand form) ---------------
  async saveDraft(draft: Partial<CreateDemandInput>): Promise<void> {
    await storage.setItem(KEYS.demandDraft, JSON.stringify(draft));
  },
  async getDraft(): Promise<Partial<CreateDemandInput> | null> {
    const raw = await storage.getItem<string>(KEYS.demandDraft, "");
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Partial<CreateDemandInput>;
    } catch {
      return null;
    }
  },
  async clearDraft(): Promise<void> {
    await storage.removeItem(KEYS.demandDraft);
  },
};
