/**
 * Auth service — the single entry point the app uses for authentication.
 *
 * When USE_MOCK is true, this uses a local mock (no real user database) so the
 * foundation is fully testable. When the DealLakay API is configured, it
 * delegates to src/api/auth.ts. The token is stored securely by AuthContext.
 *
 * IMPORTANT: DealLakay requires email verification before a new account can
 * log in — register() does NOT return a session (real or mock). The caller
 * must show a "check your email" state and route to Login afterward.
 */
import { USE_MOCK } from "@/src/constants/config";
import { authApi } from "@/src/api/auth";
import { mockDelay, genId } from "./mock-db";
import type {
  AuthSession,
  Credentials,
  RegisterInput,
  User,
} from "@/src/types";

function usernameFromEmail(email: string): string {
  return email.split("@")[0]?.toLowerCase() || "itilizatè";
}

function mockUserFromEmail(email: string, overrides: Partial<User> = {}): User {
  const uname = usernameFromEmail(email);
  return {
    id: genId("user"),
    fullName: overrides.fullName || uname.replace(/\./g, " "),
    username: uname,
    email,
    phone: overrides.phone || "",
    country: overrides.country || "Haiti",
    location: overrides.location || "port-au-prince",
    avatarUri: null,
    ...overrides,
  };
}

export const authService = {
  async login(creds: Credentials): Promise<AuthSession> {
    if (!USE_MOCK) return authApi.login(creds);
    await mockDelay();
    // Mock: accept any well-formed credentials. Real API enforces this.
    return {
      user: mockUserFromEmail(creds.username),
      token: genId("mocktoken"),
    };
  },

  async register(input: RegisterInput): Promise<{ message: string }> {
    if (!USE_MOCK) return authApi.register(input);
    await mockDelay();
    return { message: "Konfime email ou pou w ka konekte." };
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    if (!USE_MOCK) return authApi.forgotPassword(email);
    await mockDelay();
    return { message: "Si email sa a egziste, yon lyen voye." };
  },

  async logout(): Promise<void> {
    if (!USE_MOCK) {
      try {
        await authApi.logout();
      } catch {
        /* best-effort; local session is always cleared by AuthContext */
      }
    }
  },
};
