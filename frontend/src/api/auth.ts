/**
 * DealLakay AUTH API — real integration.
 *
 * Reuses the existing DealLakay authentication system (no second user
 * database). DealLakay's fields are snake_case and its login response shape
 * is `{ access_token, user }` — mapped here into this app's camelCase
 * `AuthSession`/`User` types so the rest of the app never has to know about
 * DealLakay's exact wire format.
 */
import { apiClient } from "./client";
import type { AuthSession, Credentials, RegisterInput, User } from "@/src/types";

// DealLakay's actual user shape (routers/auth.py `public_user()`), before mapping.
interface DealLakayUser {
  id: string;
  full_name: string;
  username: string;
  email: string;
  phone: string;
  country: string;
  department: string;
  city: string;
  avatar: string;
  email_verified: boolean;
  is_seller: boolean;
  is_technician: boolean;
}

interface DealLakayLoginResponse {
  access_token: string;
  user: DealLakayUser;
}

function mapUser(u: DealLakayUser): User {
  return {
    id: u.id,
    fullName: u.full_name,
    username: u.username,
    email: u.email,
    phone: u.phone,
    country: u.country,
    location: [u.city, u.department].filter(Boolean).join(", "),
    avatarUri: u.avatar || null,
    emailVerified: u.email_verified,
    isSeller: u.is_seller,
    isTechnician: u.is_technician,
  };
}

export const authApi = {
  // POST /auth/login  ->  { access_token, user }
  login: async (creds: Credentials): Promise<AuthSession> => {
    const res = await apiClient.post<DealLakayLoginResponse>(
      "/auth/login",
      { username: creds.username, password: creds.password },
      false,
    );
    return { token: res.access_token, user: mapUser(res.user) };
  },

  // POST /auth/register
  // IMPORTANT: DealLakay requires email verification before login — this does
  // NOT return a session. The caller must show a "check your email" state and
  // send the person to Login afterward, not treat this like an auto-login.
  register: async (input: RegisterInput): Promise<{ message: string }> =>
    apiClient.post<{ message: string }>(
      "/auth/register",
      {
        full_name: input.fullName,
        username: input.username,
        email: input.email,
        phone: input.phone,
        password: input.password,
        confirm_password: input.confirmPassword,
        country: input.country,
        department: input.department,
        city: input.city,
        accept_terms: input.acceptTerms,
      },
      false,
    ),

  // POST /auth/forgot-password
  forgotPassword: (email: string) =>
    apiClient.post<{ message: string }>("/auth/forgot-password", { email }, false),

  // GET /auth/me  ->  DealLakay user shape, mapped to this app's User
  me: async (): Promise<User> => mapUser(await apiClient.get<DealLakayUser>("/auth/me")),

  // POST /auth/google  ->  { access_token, user }
  // For a brand-new Google user, DealLakay returns 422 until department/city
  // are supplied — the caller (auth-context) surfaces that as a distinct
  // error so the UI can ask for location and retry with it included.
  googleLogin: async (idToken: string, department?: string, city?: string): Promise<AuthSession> => {
    const res = await apiClient.post<DealLakayLoginResponse>(
      "/auth/google",
      { credential: idToken, department, city },
      false,
    );
    return { token: res.access_token, user: mapUser(res.user) };
  },
  // DealLakay has no server-side /auth/logout (JWTs are stateless) — the
  // client simply discards its local token. Kept async for interface parity
  // with authService, which awaits this unconditionally.
  logout: async (): Promise<void> => undefined,

  // PUT /auth/me/avatar — sets the caller's own profile photo (base64 data
  // URL). Newly added to DealLakay's backend: previously avatar could only
  // be set indirectly via a seller/technician profile update.
  updateAvatar: async (base64DataUrl: string): Promise<string> => {
    const res = await apiClient.put<{ avatar: string }>("/auth/me/avatar", { avatar: base64DataUrl });
    return res.avatar;
  },
};
