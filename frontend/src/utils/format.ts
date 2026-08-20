/** Formatting helpers (Haiti-first: HTG currency, local phone). */

/** Format an integer amount with thousands separators, e.g. 40000 -> "40,000". */
export function formatNumber(value: number): string {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** Format a HTG budget or range. */
export function formatBudget(
  min: number | null,
  max: number | null,
  currency = "HTG",
): string {
  if (min != null && max != null) {
    return `${formatNumber(min)}–${formatNumber(max)} ${currency}`;
  }
  if (max != null) return `≤ ${formatNumber(max)} ${currency}`;
  if (min != null) return `≥ ${formatNumber(min)} ${currency}`;
  return "—";
}

/** Format a Haitian phone number as +509 XXXX XXXX. */
export function formatPhone(input: string): string {
  const digits = input.replace(/\D/g, "").replace(/^509/, "");
  if (digits.length <= 4) return digits;
  return `+509 ${digits.slice(0, 4)} ${digits.slice(4, 8)}`.trim();
}

/** Relative-ish date, short and dependency-free. */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Compact "time ago" for notification feeds. */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "kounye a";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}j`;
  return formatDate(iso);
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
