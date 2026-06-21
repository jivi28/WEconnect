// scripts/scrape.mjs — scrape Würth Elektronik events, geocode, upsert to Supabase.
//
//   node scripts/scrape.mjs
//
// Strategy (matches the README contract): attempt a live fetch of the public
// we-online.com events page; if the network/site fails or yields nothing usable,
// fall back to the committed snapshot in data/events.cached.json so demos never
// break. Any event missing coordinates is geocoded via OpenStreetMap Nominatim.
import { loadEnv, serviceClient, readCachedEvents } from "./_env.mjs";

loadEnv();

const SOURCE_URL = "https://www.we-online.com/en/news-center/events";
const NOMINATIM = "https://nominatim.openstreetmap.org/search";

const contact = process.env.GEOCODER_CONTACT_EMAIL || "anonymous@example.com";
const USER_AGENT = `weconnect-analysis/1.0 (${contact})`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Best-effort live scrape. Returns [] on any failure so we fall back cleanly. */
async function fetchLiveEvents() {
  try {
    const res = await fetch(SOURCE_URL, {
      headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();

    // The events page renders cards client-side; many builds also embed a JSON
    // blob (Next/Nuxt __DATA__ or JSON-LD). Try JSON-LD Event objects first —
    // that's the stable, structured path. If absent, we return [] and fall back.
    const events = [];
    const ldMatches = html.matchAll(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    );
    for (const m of ldMatches) {
      let json;
      try {
        json = JSON.parse(m[1].trim());
      } catch {
        continue;
      }
      const nodes = Array.isArray(json) ? json : json["@graph"] || [json];
      for (const node of nodes) {
        if (!node || node["@type"] !== "Event" || !node.name) continue;
        const loc = node.location?.address || {};
        events.push({
          name: String(node.name).trim(),
          type: "other",
          city: loc.addressLocality ?? null,
          country: loc.addressCountry ?? null,
          region: loc.addressCountry ?? null,
          lat: node.location?.geo?.latitude ?? null,
          lng: node.location?.geo?.longitude ?? null,
          start_date: node.startDate ? node.startDate.slice(0, 10) : null,
          end_date: (node.endDate ?? node.startDate)?.slice(0, 10) ?? null,
          source_url: node.url ?? SOURCE_URL,
          cost: null,
          is_wuerth: true,
        });
      }
    }
    return events;
  } catch (err) {
    console.warn(`  live scrape failed (${err.message}) — using cached snapshot`);
    return [];
  }
}

/** Geocode "city, country" via Nominatim. Returns {lat,lng} or null. */
async function geocode(city, country) {
  if (!city && !country) return null;
  const q = [city, country].filter(Boolean).join(", ");
  try {
    const url = `${NOMINATIM}?format=json&limit=1&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) return null;
    const hits = await res.json();
    if (!hits.length) return null;
    return { lat: Number(hits[0].lat), lng: Number(hits[0].lon) };
  } catch {
    return null;
  }
}

async function main() {
  const sb = serviceClient();

  console.log(`Scraping ${SOURCE_URL} ...`);
  let events = await fetchLiveEvents();

  if (events.length) {
    console.log(`  parsed ${events.length} live event(s) from JSON-LD`);
  } else {
    events = readCachedEvents();
    console.log(`  using ${events.length} event(s) from cached snapshot`);
  }

  // Fill in any missing coordinates (Nominatim asks for <=1 request/second).
  let geocoded = 0;
  for (const ev of events) {
    if (ev.lat == null || ev.lng == null) {
      const hit = await geocode(ev.city, ev.country);
      if (hit) {
        ev.lat = hit.lat;
        ev.lng = hit.lng;
        geocoded++;
      }
      await sleep(1100);
    }
  }
  if (geocoded) console.log(`  geocoded ${geocoded} event(s) via Nominatim`);

  // Upsert by name. We only touch the analytics columns + name; we never
  // overwrite description/event_date that the platform app may own.
  const rows = events.map((ev) => ({
    name: ev.name,
    type: ev.type ?? "other",
    city: ev.city ?? null,
    country: ev.country ?? null,
    region: ev.region ?? ev.country ?? null,
    lat: ev.lat ?? null,
    lng: ev.lng ?? null,
    start_date: ev.start_date ?? null,
    end_date: ev.end_date ?? ev.start_date ?? null,
    event_date: ev.start_date ?? null, // keep the app's column populated too
    source_url: ev.source_url ?? SOURCE_URL,
    cost: ev.cost ?? null,
    is_wuerth: ev.is_wuerth ?? true,
  }));

  const { data, error } = await sb
    .from("events")
    .upsert(rows, { onConflict: "name" })
    .select("id, name");

  if (error) {
    console.error("Upsert failed:", error.message);
    process.exit(1);
  }
  console.log(`\n✓ Upserted ${data.length} events into Supabase.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
