/**
 * Core domain types for DealLakay Alert.
 *
 * These interfaces are intentionally close to what we expect the DealLakay API
 * to return so the mock service layer can be swapped for the real API with
 * minimal changes. Keep field names stable; map API responses into these types
 * inside src/api/* rather than leaking raw API shapes into the UI.
 */

// --- Enums / unions -------------------------------------------------------

export type Urgency = "TODAY" | "THIS_WEEK" | "FLEXIBLE";

export type ProviderType = "VENDOR" | "TECHNICIAN";

export type NotificationType = string; // DealLakay has many notification types (offer, deal_alert, supplier_inquiry, etc.) — kept open rather than a fixed union.

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
  emailVerified: boolean;
  isSeller: boolean;
  isTechnician: boolean;
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

export type DemandStatus = "open" | "fulfilled" | "closed";

export interface Demand {
  id: string;
  userId: string;
  username: string;
  title: string;
  categoryId: string | null;
  description: string;
  images: string[];
  department: string;
  city: string;
  status: DemandStatus;
  responsesCount: number;
  createdAt: string; // ISO
}

/** Payload accepted by createDemand(). DealLakay's Request a Part does not
 * support quantity/budget/urgency fields — only what's listed here. */
export interface CreateDemandInput {
  title: string;
  categoryId: string;
  description: string;
  department: string;
  city: string;
  images?: string[];
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
  /** Raw destination path from DealLakay (e.g. "/product/iphone-13", "/requests/abc") — use
   * this instead of demandId for anything other than Request a Part deep links. */
  link?: string;
}

// --- Auth -----------------------------------------------------------------

export interface AuthSession {
  user: User;
  token: string;
}

export interface Credentials {
  // DealLakay login accepts either a username OR an email in this field.
  username: string;
  password: string;
}

export interface RegisterInput {
  fullName: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  country: string;
  department: string;
  city: string;
  acceptTerms: boolean;
}

// --- Generic async UI state ----------------------------------------------

export type AsyncStatus = "idle" | "loading" | "success" | "empty" | "error";
