import "./env";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getServiceClient } from "../lib/supabase";

const CACHE_PATH = join(process.cwd(), "data", "events.cached.json");

// Deterministic PRNG so seeds are reproducible across runs.
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

function dateBetween(start: string | null, rand: () => number): string {
  const base = start ? new Date(start) : new Date("2026-01-01");
  // Activity happens from the event date up to ~60 days after.
  const offsetMs = rand() * 60 * 24 * 60 * 60 * 1000;
  return new Date(base.getTime() + offsetMs).toISOString();
}

async function main() {
  const supabase = getServiceClient();

  // 1. Ensure events exist (seed works without running the scraper first).
  const cached = JSON.parse(readFileSync(CACHE_PATH, "utf8"));
  const { error: upsertErr } = await supabase
    .from("events")
    .upsert(cached.events, { onConflict: "name", ignoreDuplicates: false });
  if (upsertErr) throw new Error(`Event upsert failed: ${upsertErr.message}`);

  const { data: events, error: readErr } = await supabase
    .from("events")
    .select("id, name, start_date, type");
  if (readErr || !events) throw new Error(`Read events failed: ${readErr?.message}`);
  console.log(`Seeding engagement data for ${events.length} events ...`);

  // 2. Clear previous engagement data (cascades through FKs).
  await supabase.from("simulations").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("connections").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("users").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  const allUsers: { id: string; signup_event_id: string; signup_at: string }[] = [];
  const allConnections: any[] = [];
  const allSimulations: any[] = [];

  for (const ev of events) {
    const rand = mulberry32(hashString(ev.name));

    // Event "quality" drives the spread so some events are clearly green, some red.
    const quality = rand(); // 0..1
    const typeBoost = ev.type === "career" ? 1.4 : ev.type === "seminar" ? 1.0 : 0.8;

    const userCount = Math.max(3, Math.round((10 + quality * 90) * typeBoost));
    const users = Array.from({ length: userCount }, () => {
      const id = crypto.randomUUID();
      allUsers.push({
        id,
        signup_event_id: ev.id,
        signup_at: dateBetween(ev.start_date, rand),
      });
      return id;
    });

    // Connections: higher-quality events drive more connections per user.
    const connPerUser = quality * 4; // 0..4
    const connCount = Math.round(userCount * connPerUser);
    for (let i = 0; i < connCount; i++) {
      const a = users[Math.floor(rand() * users.length)];
      let b = users[Math.floor(rand() * users.length)];
      if (a === b) b = users[(users.indexOf(a) + 1) % users.length];
      allConnections.push({
        id: crypto.randomUUID(),
        event_id: ev.id,
        user_a_id: a,
        user_b_id: b,
        created_at: dateBetween(ev.start_date, rand),
      });
    }

    // Simulations: quality drives platform engagement after signup.
    for (const uid of users) {
      const simCount = Math.round(rand() * quality * 8); // 0..8
      for (let i = 0; i < simCount; i++) {
        allSimulations.push({
          id: crypto.randomUUID(),
          user_id: uid,
          created_at: dateBetween(ev.start_date, rand),
        });
      }
    }
  }

  // 3. Bulk insert (chunked to stay under request limits).
  await insertChunked(supabase, "users", allUsers);
  await insertChunked(supabase, "connections", allConnections);
  await insertChunked(supabase, "simulations", allSimulations);

  console.log(
    `Seeded ${allUsers.length} users, ${allConnections.length} connections, ${allSimulations.length} simulations.`
  );
  console.log("Done.");
}

async function insertChunked(supabase: any, table: string, rows: any[], size = 500) {
  for (let i = 0; i < rows.length; i += size) {
    const chunk = rows.slice(i, i + size);
    const { error } = await supabase.from(table).insert(chunk);
    if (error) throw new Error(`Insert into ${table} failed: ${error.message}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
