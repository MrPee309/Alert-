/**
 * Auth service — the single entry point the app uses for authentication.
 *
 * When USE_MOCK is true, this uses a local mock (no real user database) so the
 * foundation is fully testable. When the DealLakay API is configured, it
 * delegates to src/api/auth.ts. The token is stored securely by AuthContext.
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
      user: mockUserFromEmail(creds.email),
      token: genId("mocktoken"),
    };
  },

  async register(input: RegisterInput): Promise<AuthSession> {
    if (!USE_MOCK) return authApi.register(input);
    await mockDelay();
    return {
      user: mockUserFromEmail(input.email, {
        fullName: input.fullName,
        phone: input.phone,
        location: input.location,
      }),
      token: genId("mocktoken"),
    };
  },

  async forgotPassword(email: string): Promise<{ sent: boolean }> {
    if (!USE_MOCK) return authApi.forgotPassword(email);
    await mockDelay();
    return { sent: true };
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
