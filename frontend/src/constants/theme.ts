/**
 * DealLakay Alert — design tokens.
 * Purple/violet brand palette, matching the "DealLakay Deal Alerts" visual
 * reference (rounded cards, gradient-friendly brand purple, pill buttons).
 */

export const colors = {
  surface: "#FFFFFF",
  onSurface: "#1A1A2E",
  surfaceSecondary: "#F5F3FF",
  onSurfaceSecondary: "#5B5876",
  surfaceTertiary: "#EDE9FE",
  onSurfaceTertiary: "#7C7A94",
  surfaceInverse: "#1E1B3A",
  onSurfaceInverse: "#FFFFFF",

  brand: "#7C3AED",
  brandPrimary: "#7C3AED",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#5B21B6",
  onBrandSecondary: "#FFFFFF",
  brandTertiary: "#EDE9FE",
  onBrandTertiary: "#5B21B6",

  success: "#16A34A",
  onSuccess: "#FFFFFF",
  warning: "#D98E04",
  onWarning: "#FFFFFF",
  error: "#DC2626",
  onError: "#FFFFFF",
  info: "#5B5876",
  onInfo: "#FFFFFF",

  border: "#E9E5FB",
  borderStrong: "#C4BEE8",
  divider: "#F5F3FF",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
} as const;

export const radius = {
  sm: 6,
  md: 12,
  lg: 20,
  pill: 999,
} as const;

export const fontSize = {
  sm: 12,
  base: 14,
  lg: 16,
  xl: 20,
  "2xl": 24,
} as const;

/** Plus Jakarta Sans — max weight 500 per design guidelines. */
export const font = {
  regular: "PlusJakartaSans-Regular",
  medium: "PlusJakartaSans-Medium",
} as const;

/** Shadow tier 1 — subtle elevation only. */
export const shadow = {
  card: {
    shadowColor: "#1A2024",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  raised: {
    shadowColor: "#1A2024",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
} as const;

export const theme = { colors, spacing, radius, fontSize, font, shadow };
export type Theme = typeof theme;
