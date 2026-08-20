/**
 * Centralized HTTP client for the real DealLakay API.
 *
 * ⚠️ INTEGRATION PLACEHOLDER
 * The real DealLakay API base URL is configured via EXPO_PUBLIC_API_URL. Until
 * it is provided, the app runs on the on-device mock service layer (USE_MOCK).
 * This client is fully wired (timeout, retry, auth token injection) and ready —
 * the endpoint modules in this folder just need real paths mapped to it.
 *
 * Do NOT call this client directly from UI. UI talks to src/services/*, which
 * decides between mock and real based on config.USE_MOCK.
 */
import { DEALLAKAY_API_URL, NETWORK } from "@/src/constants/config";
import { storage } from "@/src/utils/storage";

export const AUTH_TOKEN_KEY = "dla.auth.token";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function getToken(): Promise<string | null> {
  return storage.secureGet<string | null>(AUTH_TOKEN_KEY, null);
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean;
  signal?: AbortSignal;
}

async function withTimeout<T>(
  run: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await run(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

async function rawRequest<T>(path: string, opts: RequestOptions): Promise<T> {
  if (!DEALLAKAY_API_URL) {
    throw new ApiError(
      "EXPO_PUBLIC_API_URL is not configured. Provide the DealLakay API base URL to go live.",
      0,
    );
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opts.auth) {
    const token = await getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await withTimeout(
    (signal) =>
      fetch(`${DEALLAKAY_API_URL}${path}`, {
        method: opts.method ?? "GET",
        headers,
        body: opts.body ? JSON.stringify(opts.body) : undefined,
        signal: opts.signal ?? signal,
      }),
    NETWORK.timeoutMs,
  );

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const data = await res.json();
      detail = data?.message ?? data?.detail ?? detail;
    } catch {
      /* ignore body parse errors */
    }
    throw new ApiError(detail, res.status);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** Request with retry + backoff for transient failures (slow networks). */
export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= NETWORK.retries; attempt++) {
    try {
      return await rawRequest<T>(path, opts);
    } catch (err) {
      lastError = err;
      // Do not retry auth/client errors — only network/5xx transient issues.
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) throw err;
      if (attempt < NETWORK.retries) {
        await new Promise((r) => setTimeout(r, NETWORK.retryDelayMs * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

export const apiClient = {
  get: <T>(path: string, auth = true) => request<T>(path, { method: "GET", auth }),
  post: <T>(path: string, body?: unknown, auth = true) =>
    request<T>(path, { method: "POST", body, auth }),
  put: <T>(path: string, body?: unknown, auth = true) =>
    request<T>(path, { method: "PUT", body, auth }),
  patch: <T>(path: string, body?: unknown, auth = true) =>
    request<T>(path, { method: "PATCH", body, auth }),
  delete: <T>(path: string, auth = true) => request<T>(path, { method: "DELETE", auth }),
};
