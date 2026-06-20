import "./env";
import { writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import * as cheerio from "cheerio";
import { geocode } from "./geocode";
import { getServiceClient } from "../lib/supabase";

const EVENTS_URL = "https://www.we-online.com/en/news-center/events";
const CACHE_PATH = join(process.cwd(), "data", "events.cached.json");

interface ScrapedEvent {
  name: string;
  type: string;
  city: string | null;
  country: string | null;
  region: string | null;
  lat: number | null;
  lng: number | null;
  start_date: string | null;
  end_date: string | null;
  source_url: string;
  cost: number | null;
  is_wuerth: boolean;
}

function classifyType(text: string): string {
  const t = text.toLowerCase();
  if (/(job|career|jobmesse|recruit|bonding|ikom|forum emploi)/.test(t)) return "career";
  if (/(seminar|workshop|webinar|training|tag des)/.test(t)) return "seminar";
  if (/(messe|expo|fair|kongress|congress|exhibition|fachforum)/.test(t)) return "exhibition";
  return "other";
}

/**
 * Parse event cards from the we-online events page. The site is server-rendered,
 * so the data is in the static HTML. Selectors are isolated here — if Würth
 * changes their markup, this is the only place to adjust.
 */
function parseEvents(html: string): Array<Omit<ScrapedEvent, "lat" | "lng" | "region">> {
  const $ = cheerio.load(html);
  const out: Array<Omit<ScrapedEvent, "lat" | "lng" | "region">> = [];

  // Heuristic: each event is a card/list item containing a title link and a
  // location string. Try a few container shapes the CMS commonly emits.
  const candidates = $(
    "[class*='event'], [class*='Event'], article, li[class*='teaser'], div[class*='teaser']"
  );

  candidates.each((_, el) => {
    const node = $(el);
    const title = node.find("h2, h3, h4, a").first().text().trim();
    if (!title || title.length < 3) return;

    const blockText = node.text().replace(/\s+/g, " ").trim();
    // Location heuristic: "City, Country" or "City (Country)".
    const locMatch =
      blockText.match(/([A-ZÄÖÜ][\wäöüß.\- ]+),\s*([A-ZÄÖÜ][\wäöüß.\- ]+)/) || null;
    const city = locMatch ? locMatch[1].trim() : null;
    let country = locMatch ? locMatch[2].trim() : null;
    if (country === "Czech Republic") country = "Czechia";

    const href = node.find("a").first().attr("href") || "";
    const sourceUrl = href.startsWith("http")
      ? href
      : href
      ? new URL(href, EVENTS_URL).toString()
      : EVENTS_URL;

    out.push({
      name: title,
      type: classifyType(`${title} ${blockText}`),
      city,
      country,
      start_date: null,
      end_date: null,
      source_url: sourceUrl,
      cost: null,
      is_wuerth: true,
    });
  });

  // De-duplicate by name.
  const seen = new Set<string>();
  return out.filter((e) => {
    if (seen.has(e.name)) return false;
    seen.add(e.name);
    return true;
  });
}

async function loadFromCache(): Promise<ScrapedEvent[]> {
  const raw = JSON.parse(readFileSync(CACHE_PATH, "utf8"));
  return raw.events as ScrapedEvent[];
}

async function scrape(): Promise<ScrapedEvent[]> {
  console.log(`Fetching ${EVENTS_URL} ...`);
  const res = await fetch(EVENTS_URL, {
    headers: { "User-Agent": "WEconnect-Analysis/1.0" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();

  const parsed = parseEvents(html).filter((e) => e.country);
  console.log(`Parsed ${parsed.length} events (worldwide) from live page.`);

  const enriched: ScrapedEvent[] = [];
  for (const e of parsed) {
    let lat: number | null = null;
    let lng: number | null = null;
    if (e.city && e.country) {
      const coords = await geocode(e.city, e.country);
      if (coords) {
        lat = coords.lat;
        lng = coords.lng;
      }
    }
    enriched.push({ ...e, region: e.country, lat, lng });
  }
  return enriched.filter((e) => e.lat != null);
}

async function upsert(events: ScrapedEvent[]): Promise<void> {
  const supabase = getServiceClient();
  // Idempotent upsert keyed on (name, start_date).
  const { error } = await supabase
    .from("events")
    .upsert(events, { onConflict: "name", ignoreDuplicates: false });
  if (error) throw new Error(`Supabase upsert failed: ${error.message}`);
  console.log(`Upserted ${events.length} events into Supabase.`);
}

/**
 * Scrape live events (falling back to the cached snapshot) and upsert them into
 * Supabase. Returns the number of events written. Reused by the refresh API route.
 */
export async function refreshEvents(): Promise<{ count: number; usedCache: boolean }> {
  let events: ScrapedEvent[];
  let usedCache = false;
  try {
    events = await scrape();
    if (events.length === 0) throw new Error("no events parsed");
    writeFileSync(
      CACHE_PATH,
      JSON.stringify(
        { scrapedAt: new Date().toISOString(), source: EVENTS_URL, events },
        null,
        2
      )
    );
    console.log("Updated cached snapshot.");
  } catch (err) {
    console.warn(
      `Live scrape failed (${(err as Error).message}). Falling back to cached snapshot.`
    );
    events = await loadFromCache();
    usedCache = true;
  }

  await upsert(events);
  return { count: events.length, usedCache };
}

// Run as a CLI script (`npm run scrape`) but not when imported by the API route.
const isDirectRun = process.argv[1]?.includes("scrape-events");
if (isDirectRun) {
  refreshEvents()
    .then((r) => {
      console.log(`Done. ${r.count} events${r.usedCache ? " (from cache)" : ""}.`);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
