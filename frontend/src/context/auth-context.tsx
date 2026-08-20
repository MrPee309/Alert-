/**
 * AuthContext — persistent login, secure token storage, and the app-wide user.
 *
 * Token is stored via the secure storage namespace (Keychain / EncryptedShared-
 * Preferences). The API client reads the SAME key for authenticated requests.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { storage } from "@/src/utils/storage";
import { AUTH_TOKEN_KEY } from "@/src/api/client";
import { authService } from "@/src/services/auth-service";
import { registerForPush } from "@/src/services/push-service";
import type {
  Credentials,
  RegisterInput,
  User,
} from "@/src/types";

const USER_KEY = "dla.auth.user";

interface AuthContextValue {
  user: User | null;
  initializing: boolean;
  login: (creds: Credentials) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (patch: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  // Bootstrap persisted session on cold start.
  useEffect(() => {
    (async () => {
      const token = await storage.secureGet<string | null>(AUTH_TOKEN_KEY, null);
      const savedUser = await storage.getItem<string>(USER_KEY, "");
      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser) as User);
        } catch {
          /* ignore malformed */
        }
      }
      setInitializing(false);
    })();
  }, []);

  const persistSession = useCallback(async (nextUser: User, token: string) => {
    await storage.secureSet(AUTH_TOKEN_KEY, token);
    await storage.setItem(USER_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
    // Fire-and-forget push registration (safe no-op in Expo Go / web).
    void registerForPush(nextUser.id);
  }, []);

  const login = useCallback(
    async (creds: Credentials) => {
      const session = await authService.login(creds);
      await persistSession(session.user, session.token);
    },
    [persistSession],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const session = await authService.register(input);
      await persistSession(session.user, session.token);
    },
    [persistSession],
  );

  const forgotPassword = useCallback(async (email: string) => {
    await authService.forgotPassword(email);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    await storage.secureRemove(AUTH_TOKEN_KEY);
    await storage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  const updateUser = useCallback(
    async (patch: Partial<User>) => {
      setUser((prev) => {
        if (!prev) return prev;
        const next = { ...prev, ...patch };
        void storage.setItem(USER_KEY, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  const value = useMemo(
    () => ({ user, initializing, login, register, forgotPassword, logout, updateUser }),
    [user, initializing, login, register, forgotPassword, logout, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
