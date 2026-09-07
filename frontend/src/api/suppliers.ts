/**
 * DealLakay SUPPLIERS API (mobile) — currently used only to check whether
 * the logged-in user has their own verified (status: "active") supplier
 * profile, which changes what Dashboard/Create Alert show them. Reuses the
 * existing GET /suppliers/my endpoint — no new backend capability.
 */
import { apiClient } from "./client";

export interface MySupplierProfile {
  id: string;
  status: "pending" | "active" | "rejected" | "suspended";
  company_name: string;
}

export const suppliersApi = {
  my: () => apiClient.get<MySupplierProfile[]>("/suppliers/my"),
};
