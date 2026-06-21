# WEconnect

A starter for the login → role-based profile → "build your network" flow, built with React (Vite) and Supabase (Postgres + Auth). No backend server to run — Supabase hosts the database and handles auth.

## What's in here

- **Login / Signup** — name, email, password, and a role picker (student / educator / admin). Each role saves different fields (see `src/components/RoleFields.jsx`).
- **Home** — a dashboard shell with four tabs: Profile, Network, and two placeholders (Analysis, Simulation) for your teammates' parts.
- **Profile** — shows and edits the role-specific fields.
- **Network** — the core feature: you enter interests and what you're looking for (internships, mentorship, etc.), and it ranks everyone else in the system by shared tags, with a "Connect" button.

## 1. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. In the dashboard, go to **SQL Editor → New query**, paste the contents of `supabase/schema.sql`, and run it. This creates the `profiles`, `network_profiles`, and `connections` tables with the right security rules.
3. Go to **Project Settings → API** and copy the **Project URL** and **anon public key**.
4. In this project, copy `.env.example` to `.env.local` and fill in those two values:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=xxxxx
   ```
5. By default Supabase requires email confirmation before login. For testing with your team, you can turn this off under **Authentication → Providers → Email → Confirm email** (toggle off), or just click the confirmation link Supabase emails out.

## 2. Run it

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`.

### Running the embedded module apps

The **Analysis** and **Simulation** sections in the top menu are standalone Next.js
apps embedded by iframe (see "How the section tabs work" below). To use those tabs,
run their dev servers alongside this Vite app — each in its own terminal:

```bash
# Analysis section  → http://localhost:3000
cd analysis-dashboard && npm install && npm run dev

# Simulation section → http://localhost:3001
cd simulation && npm install && npm run dev
```

The Simulation app is pinned to port 3001 (`simulation/package.json`) so it doesn't
clash with Analysis on 3000. Override the URL the iframe points at with
`VITE_SIMULATION_URL` if you host it elsewhere.

## Data model

```
profiles            (one row per user)
  id            -> auth.users.id
  name, email
  role          -> 'student' | 'educator' | 'admin'
  role_data     -> jsonb, shape depends on role (school, institution, etc.)

network_profiles   (the "build your network" inputs)
  user_id       -> auth.users.id
  bio
  interests     -> text[]
  looking_for   -> text[]   (e.g. internships, mentorship, research partners)

connections         (a request between two users)
  user_a, user_b, initiated_by
  status        -> 'pending' | 'accepted'
```

This is the schema your teammates' **Analysis** and **Simulation** modules will likely want to read from too (e.g. analysis on who's looking for what, simulations involving the connection graph) — worth syncing with them before you change table/column names.

## How the section tabs work

The top header menu lives in `src/pages/Home.jsx`. Each entry in the `tabs` array is a
button that switches a local `tab` state; the matching component renders below in
`<main>`. The first‑party sections (Profile, Network, Events, Projects) are React
components in `src/pages/`.

Two sections are teammates' standalone **Next.js** apps, vendored into this repo and
embedded by iframe rather than ported into the Vite app (they rely on Next's App
Router/server routes and a separate React 19 + Tailwind v4 toolchain):

- **Analysis** (`analysis-dashboard/`, wurth‑employee only) → iframes `http://localhost:3000` via `AnalysisTab`.
- **Simulation** (`simulation/`, all users) → iframes `http://localhost:3001` via `SimulationTab` (the simulation app's `/` redirects to the full simulator).

To add another module, drop its app into a folder, give it a unique dev port, and add a
`{ id, label }` to `tabs` plus an iframe component following `SimulationTab`.

## Notes / next steps

- The matching logic in `Network.jsx` is intentionally simple (count of shared tags). Easy to swap for something smarter later (weighting "looking for" higher than "interests," excluding already-connected people, etc.) without touching the data model.
- Connection requests are one-directional right now (`status: 'pending'` until the other person accepts) — there's no UI yet for accepting a request from your side; that's a good next feature to add to `Network.jsx`.
- No routing library is used — `App.jsx` just switches between Login/Signup/Home based on auth state, and `Home.jsx` switches tabs with local state. Fine at this size; reach for `react-router` if it grows.