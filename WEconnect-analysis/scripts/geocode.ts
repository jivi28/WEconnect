import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const CACHE_PATH = join(process.cwd(), "data", "geocode-cache.json");

type Coords = { lat: number; lng: number };
type Cache = Record<string, Coords>;

function loadCache(): Cache {
  if (!existsSync(CACHE_PATH)) return {};
  try {
    return JSON.parse(readFileSync(CACHE_PATH, "utf8")) as Cache;
  } catch {
    return {};
  }
}

function saveCache(cache: Cache): void {
  writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Geocode "city, country" to lat/lng via OpenStreetMap Nominatim.
 * Results are cached on disk; Nominatim's usage policy requires <=1 req/s and a
 * descriptive User-Agent, so we throttle and identify ourselves.
 */
export async function geocode(
  city: string,
  country: string
): Promise<Coords | null> {
  const key = `${city.trim()}, ${country.trim()}`.toLowerCase();
  const cache = loadCache();
  if (cache[key]) return cache[key];

  const contact = process.env.GEOCODER_CONTACT_EMAIL || "hackathon@example.com";
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", `${city}, ${country}`);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");

  await sleep(1100); // respect rate limit
  const res = await fetch(url, {
    headers: { "User-Agent": `WEconnect-Analysis/1.0 (${contact})` },
  });
  if (!res.ok) return null;

  const data = (await res.json()) as Array<{ lat: string; lon: string }>;
  if (!data.length) return null;

  const coords = { lat: Number(data[0].lat), lng: Number(data[0].lon) };
  cache[key] = coords;
  saveCache(cache);
  return coords;
}
