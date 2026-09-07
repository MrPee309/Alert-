import { useEffect, useState } from "react";

import { useAuth } from "@/src/context/auth-context";
import { suppliersApi } from "@/src/api/suppliers";
import { colors } from "@/src/constants/theme";

export type UserRole = "CLIENT" | "TECHNICIAN" | "SELLER" | "TECHNICIAN_SELLER" | "SUPPLIER";
export type RoleColorGroup = "CLIENT" | "PRO" | "SUPPLIER";

export const ROLE_LABELS: Record<UserRole, string> = {
  CLIENT: "Kliyan",
  TECHNICIAN: "Teknisyen",
  SELLER: "Vandè",
  TECHNICIAN_SELLER: "Teknisyen & Vandè",
  SUPPLIER: "Founisè",
};

// Three visually-distinct color groups requested: Client, Technician/Seller
// (grouped together — they share the same Dashboard capabilities), Supplier.
// Kept within the existing DealLakay palette family rather than introducing
// unrelated hues.
const ROLE_GROUP_COLORS: Record<RoleColorGroup, [string, string]> = {
  CLIENT: [colors.brandPrimary, colors.brandSecondary], // existing purple
  PRO: ["#2563EB", "#1D4ED8"], // technician + seller — blue
  SUPPLIER: ["#D97706", "#B45309"], // supplier — amber/gold
};

function roleGroupOf(role: UserRole): RoleColorGroup {
  if (role === "SUPPLIER") return "SUPPLIER";
  if (role === "CLIENT") return "CLIENT";
  return "PRO"; // TECHNICIAN | SELLER | TECHNICIAN_SELLER
}

/** Determines the user's DealLakay role for the role-specific Dashboard and
 * Create Alert flows. A verified (status "active") supplier profile is
 * checked via the existing GET /suppliers/my — there's no "is_supplier"
 * flag on the user record itself, since suppliers are a separate profile a
 * user creates, same as technician/seller profiles. */
export function useUserRole() {
  const { user } = useAuth();
  const [isVerifiedSupplier, setIsVerifiedSupplier] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    suppliersApi
      .my()
      .then((list) => setIsVerifiedSupplier(list.some((s) => s.status === "active")))
      .catch(() => setIsVerifiedSupplier(false))
      .finally(() => setLoading(false));
  }, []);

  let role: UserRole = "CLIENT";
  if (isVerifiedSupplier) {
    role = "SUPPLIER";
  } else if (user?.isTechnician && user?.isSeller) {
    role = "TECHNICIAN_SELLER";
  } else if (user?.isTechnician) {
    role = "TECHNICIAN";
  } else if (user?.isSeller) {
    role = "SELLER";
  }

  const roleColorGroup = roleGroupOf(role);

  return {
    role,
    roleLabel: ROLE_LABELS[role],
    roleColors: ROLE_GROUP_COLORS[roleColorGroup],
    isVerifiedSupplier,
    canCreateOffer: role !== "CLIENT",
    canCreateDemand: role !== "SUPPLIER",
    loading,
  };
}
