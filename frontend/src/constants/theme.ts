/**
 * DealLakay Alert — design tokens.
 * Source: /app/design_guidelines.json ("iOS-Native Clean" personality).
 * Emerald brand, solid surfaces (optimized for low-end Android), Plus Jakarta Sans.
 */

export const colors = {
  surface: "#FFFFFF",
  onSurface: "#1A2024",
  surfaceSecondary: "#F4F6F8",
  onSurfaceSecondary: "#465159",
  surfaceTertiary: "#EAECEF",
  onSurfaceTertiary: "#2E363C",
  surfaceInverse: "#1A2024",
  onSurfaceInverse: "#FFFFFF",

  brand: "#107C55",
  brandPrimary: "#107C55",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#0E5B3F",
  onBrandSecondary: "#FFFFFF",
  brandTertiary: "#E7F6F0",
  onBrandTertiary: "#0E5B3F",

  success: "#198754",
  onSuccess: "#FFFFFF",
  warning: "#D98E04",
  onWarning: "#FFFFFF",
  error: "#DC3545",
  onError: "#FFFFFF",
  info: "#465159",
  onInfo: "#FFFFFF",

  border: "#EAECEF",
  borderStrong: "#C1C7CD",
  divider: "#F4F6F8",
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
