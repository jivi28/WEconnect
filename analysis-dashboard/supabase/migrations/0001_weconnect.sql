-- WEconnect — Event ROI analysis schema additions
-- ---------------------------------------------------------------------------
-- This migration extends the EXISTING platform schema that Anushree's app
-- already owns (events, profiles, network_profiles, connections, user_events)
-- with the columns + table + view the analytics dashboard reads.
--
-- It is additive and idempotent: it never drops or rewrites her tables, only
-- ADDs columns (IF NOT EXISTS) and CREATEs a new table + view. Safe to re-run.
--
-- Run this once in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query
-- -> paste -> Run), or via `supabase db push` if you use the CLI.
-- ---------------------------------------------------------------------------

-- 1) Enrich `events` with the geo / type / cost fields the map + ROI need.
--    The platform creates events with just (name, description, event_date);
--    the scraper fills the rest for Würth events.
alter table public.events
  add column if not exists type        text,
  add column if not exists city        text,
  add column if not exists country     text,
  add column if not exists region      text,
  add column if not exists lat         double precision,
  add column if not exists lng         double precision,
  add column if not exists start_date  date,
  add column if not exists end_date    date,
  add column if not exists source_url  text,
  add column if not exists cost        numeric,
  add column if not exists is_wuerth   boolean not null default false;

-- The scraper upserts events by name; give it a conflict target.
create unique index if not exists events_name_key on public.events (name);

-- 2) `simulations` — one row per simulation an attendee runs on the platform.
--    This is the metric the dashboard tracks alongside connections. We attach
--    it to both the user (profiles.id) and the event it is attributed to.
create table if not exists public.simulations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete set null,
  event_id    uuid references public.events(id)   on delete set null,
  scenario    text,
  created_at  timestamptz not null default now()
);

create index if not exists simulations_event_id_idx on public.simulations (event_id);
create index if not exists simulations_user_id_idx  on public.simulations (user_id);

-- 3) `event_metrics` — the read contract the dashboard consumes. One row per
--    event with raw, pre-scoring engagement counts. Column names match the
--    EventMetrics TypeScript interface exactly (lib/weconnect/types.ts).
--
--    Attribution model:
--      * a user is attributed to the event they signed up from
--        (profiles.source_event_id) — that drives `new_users`;
--      * a connection is attributed to the event whose attendee INITIATED it
--        (connections.initiated_by -> that profile's source_event_id);
--      * a simulation is attributed directly via simulations.event_id.
create or replace view public.event_metrics as
with signups as (
  select source_event_id as event_id,
         count(*)::int    as new_users
  from public.profiles
  where source_event_id is not null
  group by source_event_id
),
conns as (
  select p.source_event_id              as event_id,
         count(*)::int                  as total_connections,
         count(distinct c.initiated_by)::int as users_connected
  from public.connections c
  join public.profiles p on p.id = c.initiated_by
  where p.source_event_id is not null
  group by p.source_event_id
),
sims as (
  select event_id,
         count(*)::int                  as total_simulations,
         count(distinct user_id)::int   as users_simulated
  from public.simulations
  where event_id is not null
  group by event_id
)
select
  e.id                                           as event_id,
  e.name,
  e.type,
  e.city,
  e.country,
  coalesce(e.region, e.country)                  as region,
  e.lat,
  e.lng,
  coalesce(e.start_date::text, e.event_date::text) as start_date,
  coalesce(e.end_date::text, e.event_date::text)   as end_date,
  e.cost,
  coalesce(e.is_wuerth, false)                   as is_wuerth,
  coalesce(s.new_users, 0)                       as new_users,
  coalesce(c.total_connections, 0)               as total_connections,
  coalesce(sm.total_simulations, 0)              as total_simulations,
  case when coalesce(s.new_users, 0) > 0
       then coalesce(c.total_connections, 0)::numeric / s.new_users
       else 0 end                                as avg_connections,
  case when coalesce(s.new_users, 0) > 0
       then coalesce(sm.total_simulations, 0)::numeric / s.new_users
       else 0 end                                as avg_simulations,
  coalesce(c.users_connected, 0)                 as users_connected,
  coalesce(sm.users_simulated, 0)                as users_simulated
from public.events e
left join signups s  on s.event_id  = e.id
left join conns   c  on c.event_id  = e.id
left join sims    sm on sm.event_id = e.id;

-- Let the API roles read the view (service_role already bypasses RLS; granting
-- anon/authenticated lets a browser-side anon client read it too if needed).
grant select on public.event_metrics to anon, authenticated, service_role;
