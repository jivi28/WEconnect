import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { EventMetrics } from "./types";

// Mock mode lets the dashboard run with zero backend: when Supabase env vars are
// absent we synthesize engagement metrics in-memory from the cached events,
// using the same deterministic model as scripts/seed.ts.

export function isMockMode(): boolean {
  return (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Stable id from the event name (no DB to hand out UUIDs).
function idFor(name: string): string {
  return `mock-${hashString(name).toString(16)}`;
}

interface CachedEvent {
  name: string;
  type: string | null;
  city: string | null;
  country: string | null;
  region: string | null;
  lat: number | null;
  lng: number | null;
  start_date: string | null;
  end_date: string | null;
  cost: number | null;
  is_wuerth: boolean;
  attendees?: number; // optional override for the synthesized cohort size
}

let cache: EventMetrics[] | null = null;

export function getMockMetrics(): EventMetrics[] {
  if (cache) return cache;

  const raw = JSON.parse(
    readFileSync(join(process.cwd(), "data", "events.cached.json"), "utf8")
  );
  const events = raw.events as CachedEvent[];

  cache = events.map((ev) => {
    const rand = mulberry32(hashString(ev.name));
    const quality = rand(); // 0..1 drives the spread (green vs red)
    const typeBoost =
      ev.type === "career" ? 1.4 : ev.type === "seminar" ? 1.0 : 0.8;

    const newUsers =
      ev.attendees ?? Math.max(3, Math.round((10 + quality * 90) * typeBoost));

    // Simulate each attendee's journey so funnel counts are real subsets.
    let totalConnections = 0;
    let totalSimulations = 0;
    let usersConnected = 0;
    let usersSimulated = 0;
    for (let i = 0; i < newUsers; i++) {
      // Higher-quality events convert more attendees into active users.
      const didConnect = rand() < 0.35 + quality * 0.6;
      if (didConnect) {
        usersConnected += 1;
        totalConnections += 1 + Math.round(rand() * quality * 7); // 1..~8
        const didSimulate = rand() < 0.3 + quality * 0.6;
        if (didSimulate) {
          usersSimulated += 1;
          totalSimulations += 1 + Math.round(rand() * quality * 7);
        }
      }
    }

    return {
      event_id: idFor(ev.name),
      name: ev.name,
      type: ev.type,
      city: ev.city,
      country: ev.country,
      region: ev.region ?? ev.country,
      lat: ev.lat,
      lng: ev.lng,
      start_date: ev.start_date,
      end_date: ev.end_date,
      cost: ev.cost,
      is_wuerth: ev.is_wuerth,
      new_users: newUsers,
      total_connections: totalConnections,
      total_simulations: totalSimulations,
      avg_connections: newUsers ? totalConnections / newUsers : 0,
      avg_simulations: newUsers ? totalSimulations / newUsers : 0,
      users_connected: usersConnected,
      users_simulated: usersSimulated,
    };
  });

  return cache;
}
