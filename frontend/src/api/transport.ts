/**
 * DealLakay TRANSPORT API (mobile) — Phase 1 (Driver + Station foundation).
 * Same request/error conventions as every other api/*.ts file — reuses the
 * shared apiClient, no separate HTTP setup.
 */
import { apiClient } from "./client";

export type ServiceType = "moto_taxi" | "delivery" | "moto_taxi_delivery";
export type DriverStatus = "offline" | "available" | "busy" | "suspended";
export type VerificationStatus = "pending" | "verified" | "rejected" | "suspended";

export interface Motorcycle {
  brand: string;
  model: string;
  year?: number;
  color?: string;
  plate: string;
}

export interface DriverProfile {
  id: string;
  user_id: string;
  city: string;
  area: string;
  station_id: string | null;
  service_types: ServiceType[];
  motorcycle: Motorcycle;
  verification_status: VerificationStatus;
  status: DriverStatus;
  rating: number;
  review_count: number;
  created_at: string;
}

export interface Station {
  id: string;
  name: string;
  city: string;
  area: string;
  driver_count: number;
}

export interface BecomeDriverInput {
  city: string;
  area?: string;
  station_id?: string | null;
  service_types: ServiceType[];
  motorcycle: Motorcycle;
  accept_driver_terms: boolean;
}

export const transportApi = {
  becomeDriver: (data: BecomeDriverInput) =>
    apiClient.post<{ message: string; status: string }>("/transport/drivers/become", data),

  myDriverProfile: () => apiClient.get<DriverProfile>("/transport/drivers/me"),

  updateStatus: (status: DriverStatus) =>
    apiClient.put<{ message: string; status: DriverStatus }>("/transport/drivers/status", { status }),

  updateLocation: (lat: number, lng: number) =>
    apiClient.put<{ message: string }>("/transport/drivers/location", { lat, lng }),

  listStations: (city?: string) =>
    apiClient.get<Station[]>(`/transport/stations${city ? `?city=${encodeURIComponent(city)}` : ""}`),
};
