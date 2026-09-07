/**
 * DealLakay LOCATIONS API — read-only, public (no auth required).
 * Reuses the same department/city data the main DealLakay site uses for
 * registration and product filters — no duplicate location system.
 */
import { apiClient } from "./client";

export interface DealLakayLocation {
  id: string;
  name: string;
  cities: string[];
}

export const locationsApi = {
  list: () => apiClient.get<DealLakayLocation[]>("/locations", false),
};
