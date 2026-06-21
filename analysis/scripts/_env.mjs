// Shared helpers for the standalone data scripts (scrape / seed).
// These run under plain `node` (not Next), so they load .env themselves and
// build a service-role Supabase client. No extra dependencies.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const ROOT = process.cwd();

/** Minimal .env parser — enough for KEY=value lines, ignores comments/blanks. */
export function loadEnv() {
  let raw = "";
  try {
    raw = readFileSync(join(ROOT, ".env"), "utf8");
  } catch {
    throw new Error("No .env file found. Copy .env.example to .env first.");
  }
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let val = m[2].trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(m[1] in process.env)) process.env[m[1]] = val;
  }
}

/** Service-role client. Bypasses RLS — scripts only, never the browser. */
export function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env"
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const CACHE_PATH = join(ROOT, "data", "events.cached.json");

/** Read the cached scrape snapshot (the offline fallback / demo source). */
export function readCachedEvents() {
  const raw = JSON.parse(readFileSync(CACHE_PATH, "utf8"));
  return raw.events;
}
