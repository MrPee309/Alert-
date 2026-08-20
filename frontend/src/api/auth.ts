/**
 * DealLakay AUTH API — endpoint mapping (INTEGRATION PLACEHOLDER).
 *
 * TODO(DealLakay): map these to the real auth endpoints. Do NOT create a second
 * user database — reuse the existing DealLakay authentication system. Confirm
 * the exact paths and response shapes with the DealLakay backend team, then map
 * responses into our `User`/`AuthSession` types.
 */
import { apiClient } from "./client";
import type { AuthSession, Credentials, RegisterInput, User } from "@/src/types";

export const authApi = {
  // POST /auth/login  ->  { user, token }
  login: (creds: Credentials) =>
    apiClient.post<AuthSession>("/auth/login", creds, false),

  // POST /auth/register
  register: (input: RegisterInput) =>
    apiClient.post<AuthSession>("/auth/register", input, false),

  // POST /auth/forgot-password
  forgotPassword: (email: string) =>
    apiClient.post<{ sent: boolean }>("/auth/forgot-password", { email }, false),

  // GET /auth/me
  me: () => apiClient.get<User>("/auth/me"),

  // POST /auth/logout
  logout: () => apiClient.post<void>("/auth/logout"),
};
