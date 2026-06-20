/**
 * Weekly Challenge product rotation.
 *
 * The "employee admin" maintains the ordered WEEKLY_PRODUCTS list below. The
 * current ISO week deterministically selects one product, so every student sees
 * the SAME challenge all week, and it advances to the next product each week.
 * Repeats only once the whole list is exhausted — add more entries to extend
 * the non-repeating run.
 */

/** Ordered rotation. Edit this list to control which product appears each week. */
export const WEEKLY_PRODUCTS: string[] = [
  "Washing Machine",
  "Solar Inverter",
  "Electric Scooter",
  "Smart Thermostat",
  "Drone",
  "Wireless Speaker",
  "Robot Vacuum Cleaner",
  "EV Charging Station",
  "Gaming Laptop",
  "Smart Doorbell Camera",
  "Electric Toothbrush",
  "Air Purifier",
  "Cordless Drill",
  "Smartwatch",
  "Home WiFi Router",
  "LED Grow Light",
  "Espresso Machine",
  "Portable Power Bank",
  "Dishwasher",
  "Electric Bicycle",
  "Noise-Cancelling Headphones",
  "Smart Smoke Detector",
  "Induction Cooktop",
  "Heart-Rate Monitor",
  "Solar Garden Light",
  "Baby Monitor",
];

/** Fixed reference Monday (ISO week 1 anchor) used to count weeks. */
const EPOCH = Date.UTC(2024, 0, 1); // 2024-01-01 was a Monday.
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Whole weeks elapsed since EPOCH for the given date. */
function weekIndex(date: Date): number {
  return Math.floor((date.getTime() - EPOCH) / WEEK_MS);
}

/** Stable key for "which week", e.g. "2026-W25" — used to cap one point/week. */
export function getWeekKey(date: Date = new Date()): string {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  // ISO week number (Thursday-based).
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** The product assigned to the given week (defaults to the current week). */
export function getWeeklyProduct(date: Date = new Date()): string {
  const index =
    ((weekIndex(date) % WEEKLY_PRODUCTS.length) + WEEKLY_PRODUCTS.length) %
    WEEKLY_PRODUCTS.length;
  return WEEKLY_PRODUCTS[index];
}

/** When the current week's challenge rolls over to the next product. */
export function getNextResetDate(date: Date = new Date()): Date {
  return new Date(EPOCH + (weekIndex(date) + 1) * WEEK_MS);
}
