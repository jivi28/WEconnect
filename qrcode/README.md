# WEconnect — Event QR registration + slides

QR-driven event funnel for WEconnect. Each event has a unique QR code; attendees
scan it to register for the platform (the signup is attributed to that event) and,
as a reward, unlock the event's slide deck. Würth employees manage events, slides,
QR codes, and hosts.

## Stack
- Vite + React (`src/`)
- Supabase (Postgres + Auth + Storage), via `@supabase/supabase-js`
- `qrcode` for client-side QR generation

## Run locally
```bash
npm install
cp .env.example .env   # then fill in your Supabase URL + publishable key
npm run dev            # http://localhost:5173
```

`.env` is gitignored. `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (publishable
key) are required; `VITE_PUBLIC_BASE_URL` is optional (point the QR at a LAN IP /
tunnel so a phone can reach the register page).

## Routes
- `/admin` — Würth-employee overview: all events grouped Upcoming/Past, signups-via-QR
  counts, create events. (`role = 'wurth_employee'` only.)
- `/admin/:eventId` — per-event: upload/remove slides, the permanent QR code, hosts.
- `/register?e=<qr_token>` — QR target: signup attributed to the event.
- `/slides` — registered attendees download their event's deck via signed URLs.

## Backend (Supabase)
Schema/RLS lives in [`supabase/migrations/`](supabase/migrations). Apply them to your
project (Supabase CLI `supabase db push`, or run the SQL in the dashboard). Summary:
1. `events.host_ids`, `slides_path`, unique `qr_token` (one stable QR per event).
2. `handle_new_user` trigger also auto-registers attendees into `user_events`.
3. `event_by_qr_token(text)` — anon RPC resolving a QR token to minimal event info.
4. Private `event-slides` storage bucket + RLS (download gated to registered
   attendees / hosts / Würth employees; manage limited to hosts / Würth employees).
5. Event INSERT/UPDATE policies based on `wurth_employee` + event hosts.

Notes:
- These migrations assume the existing WEconnect schema (`profiles`, `events`,
  `user_events`, the `on_auth_user_created` trigger). They are additive.
- For full browser signup testing, disable "Confirm email" in Supabase Auth (or wire
  SMTP); otherwise GoTrue's email step blocks signup.
