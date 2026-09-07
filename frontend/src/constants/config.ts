/**
 * App configuration & feature flags.
 * All values come from environment variables — never hardcode secrets here.
 */

/** Base URL of the real DealLakay marketplace API. Empty until provided. */
export const DEALLAKAY_API_URL = (process.env.EXPO_PUBLIC_API_URL ?? "").trim();

/** DealLakay website base URL — used to open product/request pages in-browser
 * (e.g. "View Deal") since this app doesn't duplicate the marketplace UI. */
export const WEBSITE_URL = (process.env.EXPO_PUBLIC_WEBSITE_URL ?? "").trim();

/** Base URL of the companion backend (push relay). */
export const BACKEND_URL = (process.env.EXPO_PUBLIC_BACKEND_URL ?? "").trim();

/** Google OAuth Web Client ID — reuses DealLakay's existing Google Client ID
 * (same value already configured for the DealLakay website). */
export const GOOGLE_CLIENT_ID = (process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? "").trim();

/**
 * When true, the app uses the on-device mock service layer instead of the real
 * DealLakay API. Automatically true when no API URL is configured.
 * Set EXPO_PUBLIC_USE_MOCK=false (and provide EXPO_PUBLIC_API_URL) to go live.
 */
export const USE_MOCK =
  process.env.EXPO_PUBLIC_USE_MOCK === "true" || DEALLAKAY_API_URL.length === 0;

/** Network defaults tuned for slow / low-bandwidth connections (Haiti-first). */
export const NETWORK = {
  timeoutMs: 15000,
  retries: 2,
  retryDelayMs: 800,
} as const;

/** Image compression defaults to save mobile data on upload. */
export const IMAGE = {
  maxWidth: 1080,
  compress: 0.6,
} as const;

export const APP = {
  name: "DealLakay Alert",
  defaultCurrency: "HTG",
  defaultCountry: "Haiti",
  pageSize: 20,
} as const;
