/**
 * DealLakay USERS API — endpoint mapping (INTEGRATION PLACEHOLDER).
 * Reuse the existing DealLakay user profile — do not duplicate it.
 * TODO(DealLakay): map to real endpoints.
 */
import { apiClient } from "./client";
import type { User } from "@/src/types";

export const usersApi = {
  // GET /users/me
  getProfile: () => apiClient.get<User>("/users/me"),

  // PATCH /users/me
  updateProfile: (patch: Partial<User>) =>
    apiClient.patch<User>("/users/me", patch),
};
