import type { RoiTier } from "./types";

// Tailwind/CSS colors shared by the map, panels, and charts.
export const TIER_COLOR: Record<RoiTier, string> = {
  good: "#16a34a",
  mid: "#f59e0b",
  poor: "#dc2626",
};

export const TIER_LABEL: Record<RoiTier, string> = {
  good: "High ROI",
  mid: "Moderate ROI",
  poor: "Low ROI",
};

export function fmt(n: number, digits = 1): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(digits);
}

export function fmtEuro(n: number | null): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}
