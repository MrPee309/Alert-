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

export interface TransportRequestInput {
  service_type: ServiceType;
  pickup_address: string;
  pickup_lat: number;
  pickup_lng: number;
  destination_address: string;
  destination_lat?: number;
  destination_lng?: number;
  passenger_count?: number;
  package_description?: string;
  notes?: string;
}

export type RequestStatus = "matching" | "accepted" | "no_driver_found" | "cancelled" | "trip_started" | "trip_completed";

export interface TransportRequest {
  id: string;
  service_type: ServiceType;
  pickup_address: string;
  destination_address: string;
  passenger_count: number | null;
  package_description: string;
  notes: string;
  status: RequestStatus;
  matched_driver_id: string | null;
  conversation_id: string | null;
  created_at: string;
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

  createRequest: (data: TransportRequestInput) =>
    apiClient.post<TransportRequest>("/transport/requests", data),

  getRequest: (id: string) => apiClient.get<TransportRequest>(`/transport/requests/${id}`),

  myRequests: () => apiClient.get<TransportRequest[]>("/transport/requests/mine"),

  cancelRequest: (id: string) => apiClient.post<{ message: string }>(`/transport/requests/${id}/cancel`),

  pendingDriverRequests: () => apiClient.get<TransportRequest[]>("/transport/driver/pending-requests"),

  acceptRequest: (id: string) => apiClient.post<TransportRequest>(`/transport/requests/${id}/accept`),

  rejectRequest: (id: string) => apiClient.post<{ message: string }>(`/transport/requests/${id}/reject`),
};
