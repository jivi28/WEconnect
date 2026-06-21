// scripts/seed.mjs — populate a SMALL, reversible demo cohort so the dashboard
// shows real engagement (signups / connections / simulations).
//
//   node scripts/seed.mjs          # create the demo cohort
//   node scripts/seed.mjs --clear  # remove everything this script created
//
// Anushree's `profiles` table is backed by Supabase Auth (profiles.id -> auth.users)
// and constrains role to student/educator/admin, so we can't fabricate bare profile
// rows. Instead we create REAL auth users via the Admin API, each tagged
// user_metadata.seed = true (and role_data.seed = true) so --clear can find and
// delete them. Real platform users are never touched.
//
// Everything is bounded by PER_EVENT_CAP to keep the footprint in the shared
// project small. Re-running clears the previous cohort first (idempotent).
import { loadEnv, serviceClient } from "./_env.mjs";

loadEnv();
const sb = serviceClient();
const CLEAR = process.argv.includes("--clear");

const PER_EVENT_CAP = 15; // max synthetic users per event
const ROLES = ["student", "student", "student", "educator", "admin"]; // mostly students
const CONN_STATUS = "accepted"; // only pending/accepted pass Anushree's check

// --- deterministic RNG (same model as lib/weconnect/mock.ts) ----------------
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

async function insertChunked(table, rows) {
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await sb.from(table).insert(rows.slice(i, i + 500));
    if (error) throw new Error(`${table}: ${error.message}`);
  }
}

/** All auth users we created, identified by user_metadata.seed === true. */
async function listSeedUserIds() {
  const ids = [];
  for (let page = 1; page < 100; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    for (const u of data.users) {
      if (u.user_metadata?.seed === true) ids.push(u.id);
    }
    if (data.users.length < 200) break;
  }
  return ids;
}

async function clearSeed() {
  console.log("Clearing previously seeded data ...");
  const ids = await listSeedUserIds();
  console.log(`  ${ids.length} seeded auth user(s) found`);
  if (ids.length) {
    // children of the seeded profiles first
    await sb.from("connections").delete().in("initiated_by", ids);
    await sb.from("simulations").delete().in("user_id", ids);
    await sb.from("user_events").delete().in("user_id", ids);
    await sb.from("profiles").delete().in("id", ids);
    for (const id of ids) await sb.auth.admin.deleteUser(id);
  }
  console.log("✓ Seed data cleared.");
}

async function seed() {
  const { data: events, error } = await sb
    .from("events")
    .select("id, name, type");
  if (error) throw error;
  console.log(`Seeding engagement across ${events.length} events ...`);

  // 1) Plan the deterministic cohort + per-user journey for every event.
  const plan = []; // { event, members:[{conns, sims}] }
  for (const ev of events) {
    const rand = mulberry32(hashString(ev.name));
    const quality = rand();
    const typeBoost = ev.type === "career" ? 1.0 : ev.type === "seminar" ? 0.8 : 0.6;
    const size = Math.max(3, Math.round((3 + quality * (PER_EVENT_CAP - 3)) * typeBoost));
    const members = [];
    for (let i = 0; i < Math.min(PER_EVENT_CAP, size); i++) {
      const didConnect = rand() < 0.4 + quality * 0.55;
      const conns = didConnect ? 1 + Math.round(rand() * quality * 4) : 0;
      const didSim = didConnect && rand() < 0.35 + quality * 0.55;
      const sims = didSim ? 1 + Math.round(rand() * quality * 4) : 0;
      members.push({ conns, sims });
    }
    plan.push({ event: ev, members });
  }

  const total = plan.reduce((n, p) => n + p.members.length, 0);
  console.log(`  creating ${total} tagged auth users (this is the slow part) ...`);

  // 2) Create real auth users (one API call each) and build the row sets.
  const profiles = [];
  const userEvents = [];
  const simulations = [];
  const cohortIds = []; // [{ eventMembers:[id...] }] parallel to plan
  let made = 0;
  for (const p of plan) {
    const ids = [];
    for (let i = 0; i < p.members.length; i++) {
      const tag = crypto.randomUUID().slice(0, 8);
      const email = `seed_${tag}@example.com`;
      const { data, error: ce } = await sb.auth.admin.createUser({
        email,
        password: crypto.randomUUID(),
        email_confirm: true,
        user_metadata: { seed: true, event: p.event.name },
      });
      if (ce) throw new Error(`createUser: ${ce.message}`);
      const id = data.user.id;
      ids.push(id);
      const role = ROLES[hashString(id) % ROLES.length];
      profiles.push({
        id,
        name: `Demo ${role} ${tag}`,
        email,
        role,
        role_data: { seed: true, event: p.event.name },
        source_event_id: p.event.id,
      });
      userEvents.push({ user_id: id, event_id: p.event.id });
      for (let s = 0; s < p.members[i].sims; s++) {
        simulations.push({ user_id: id, event_id: p.event.id, scenario: "seed" });
      }
      if (++made % 25 === 0) console.log(`    ${made}/${total} users ...`);
    }
    cohortIds.push(ids);
  }

  // 3) Persist profiles / attendance / simulations.
  console.log(`  inserting ${profiles.length} profiles, ${simulations.length} simulations ...`);
  await insertChunked("profiles", profiles);
  await insertChunked("user_events", userEvents);
  await insertChunked("simulations", simulations);

  // 4) Connections: each connecting member links to other attendees of the event.
  const connections = [];
  plan.forEach((p, idx) => {
    const ids = cohortIds[idx];
    if (ids.length < 2) return;
    p.members.forEach((m, i) => {
      for (let k = 0; k < m.conns; k++) {
        const other = ids[(i + 1 + k) % ids.length];
        if (other === ids[i]) continue;
        connections.push({
          user_a: ids[i],
          user_b: other,
          initiated_by: ids[i],
          status: CONN_STATUS,
        });
      }
    });
  });
  console.log(`  inserting ${connections.length} connections ...`);
  await insertChunked("connections", connections);

  console.log("\n✓ Seed complete — event_metrics now reflects real engagement.");
}

async function main() {
  if (CLEAR) {
    await clearSeed();
    return;
  }
  await clearSeed(); // keep re-runs idempotent
  await seed();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
