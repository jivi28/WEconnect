# WEconnect — Event ROI Analysis

Company/admin dashboard for the WEconnect hackathon platform (Würth Electronics track).
It shows a map of Europe with every Würth student-connection event as a marker, and
computes the **ROI** of each event and region from platform engagement:

- **New users** acquired through the event
- **Average connections** made by those users
- **Average simulations** those users ran on the platform

…combined into a tunable composite **ROI score (0–100)**, color-coded green / amber / red.

## Stack

- **Next.js (App Router) + TypeScript + Tailwind**
- **Supabase (Postgres)** — shared schema the platform team also writes into
- **Leaflet + OpenStreetMap** — Europe map, no API key needed
- **Recharts** — funnel + comparison charts

## Setup

1. **Install**
   ```bash
   npm install
   ```

2. **Supabase** — create a project at https://app.supabase.com, then copy credentials:
   ```bash
   cp .env.example .env
   # fill NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
   ```

3. **Apply schema** — run `supabase/migrations/0001_init.sql` via the Supabase SQL editor,
   or with the CLI:
   ```bash
   supabase db push
   ```

4. **Seed** demo data (Würth events + synthetic users/connections/simulations):
   ```bash
   npm run seed
   ```

5. **Run**
   ```bash
   npm run dev      # http://localhost:3000
   ```

## Scripts

| Command          | What it does                                                        |
| ---------------- | ------------------------------------------------------------------- |
| `npm run dev`    | Start the dashboard                                                 |
| `npm run seed`   | Upsert events from `data/events.cached.json` + generate engagement  |
| `npm run scrape` | Scrape live events from we-online.com, geocode, upsert to Supabase  |
| `npm test`       | Run ROI engine unit tests (`lib/roi.test.ts`)                       |
| `npm run build`  | Production build                                                    |

The scraper falls back to the cached snapshot if the live site/network fails, so demos
never break.

## How it fits together

- **Schema / contract:** `supabase/migrations/0001_init.sql` — `events`, `users`,
  `connections`, `simulations` + the `event_metrics` view.
- **ROI math (pure, tested):** `lib/roi.ts`.
- **Data access:** `lib/analytics.ts` → reads `event_metrics`, scores, aggregates regions.
- **API:** `app/api/events`, `.../events/[id]/analytics`, `.../regions/[region]/analytics`,
  `.../analytics/compare`, `.../events/refresh`.
- **UI:** `components/Dashboard.tsx` orchestrates the map (`EuropeMap.tsx`), analytics
  panels, compare view, ROI weight sliders, and leaderboard.

When the platform team's real `users` / `connections` / `simulations` rows start flowing
into the shared Supabase tables, the dashboard reads them live — no code change needed.
