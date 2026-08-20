/**
 * Core domain types for DealLakay Alert.
 *
 * These interfaces are intentionally close to what we expect the DealLakay API
 * to return so the mock service layer can be swapped for the real API with
 * minimal changes. Keep field names stable; map API responses into these types
 * inside src/api/* rather than leaking raw API shapes into the UI.
 */

// --- Enums / unions -------------------------------------------------------

export type DemandStatus =
  | "ACTIVE"
  | "MATCHING"
  | "RESPONSES"
  | "COMPLETED"
  | "CANCELLED"
  | "EXPIRED";

export type Urgency = "TODAY" | "THIS_WEEK" | "FLEXIBLE";

export type ProviderType = "VENDOR" | "TECHNICIAN";

export type NotificationType =
  | "MATCH"
  | "RESPONSE"
  | "UPDATE"
  | "EXPIRATION"
  | "SYSTEM";

export type Language = "ht" | "fr" | "en";

// --- Reference data -------------------------------------------------------

export interface Category {
  id: string;
  name: string;
  /** Feather icon name. */
  icon: string;
}

export interface LocationOption {
  id: string;
  name: string;
  department?: string;
}

// --- User -----------------------------------------------------------------

export interface User {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  country: string;
  location: string;
  avatarUri?: string | null;
}

// --- Providers (vendors / technicians) ------------------------------------

export interface Vendor {
  id: string;
  name: string;
  type: ProviderType;
  rating: number;
  location: string;
  avatarUri?: string | null;
  verified: boolean;
}

export type Technician = Vendor;

// --- Demands --------------------------------------------------------------

export interface Demand {
  id: string;
  userId: string;
  title: string;
  categoryId: string;
  description: string;
  photoUri?: string | null;
  quantity: number;
  budgetMin: number | null;
  budgetMax: number | null;
  currency: string; // "HTG"
  locationId: string;
  urgency: Urgency;
  alertDurationDays: number;
  status: DemandStatus;
  responsesCount: number;
  createdAt: string; // ISO
  expiresAt: string; // ISO
}

/** Payload accepted by createDemand(). */
export interface CreateDemandInput {
  title: string;
  categoryId: string;
  description: string;
  photoUri?: string | null;
  quantity: number;
  budgetMin: number | null;
  budgetMax: number | null;
  locationId: string;
  urgency: Urgency;
  alertDurationDays: number;
}

export interface DemandResponse {
  id: string;
  demandId: string;
  vendor: Vendor;
  message: string;
  price: number | null;
  currency: string;
  createdAt: string;
}

// --- Alerts / notifications ----------------------------------------------

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  demandId?: string | null;
}

// --- Auth -----------------------------------------------------------------

export interface AuthSession {
  user: User;
  token: string;
}

export interface Credentials {
  email: string;
  password: string;
}

export interface RegisterInput {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  location: string;
}

// --- Generic async UI state ----------------------------------------------

export type AsyncStatus = "idle" | "loading" | "success" | "empty" | "error";
