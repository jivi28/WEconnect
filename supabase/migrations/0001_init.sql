-- WEconnect analysis module — shared schema.
-- This is the contract the connection-platform team writes into; the dashboard reads it.
-- Apply with: supabase db push   (or paste into the Supabase SQL editor)

-- ---------------------------------------------------------------------------
-- Core tables
-- ---------------------------------------------------------------------------

create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  name        text        not null,
  type        text,                       -- 'career' | 'seminar' | 'exhibition' | 'webinar' | ...
  city        text,
  country     text,
  region      text,                       -- grouping for the regional rollup (country name for now)
  lat         double precision,
  lng         double precision,
  start_date  date,
  end_date    date,
  source_url  text,
  cost        numeric,                    -- optional event budget, enables cost-adjusted ROI
  is_wuerth   boolean     not null default true,
  created_at  timestamptz not null default now(),
  unique (name)                          -- lets scrape/seed upsert on name
);

create table if not exists public.users (
  id              uuid primary key default gen_random_uuid(),
  signup_event_id uuid references public.events (id) on delete set null,
  signup_at       timestamptz not null default now()
);

create table if not exists public.connections (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid references public.events (id) on delete cascade,
  user_a_id   uuid references public.users (id) on delete cascade,
  user_b_id   uuid references public.users (id) on delete cascade,
  created_at  timestamptz not null default now()
);

create table if not exists public.simulations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.users (id) on delete cascade,
  created_at  timestamptz not null default now()
);

create index if not exists idx_users_signup_event on public.users (signup_event_id);
create index if not exists idx_connections_event on public.connections (event_id);
create index if not exists idx_simulations_user on public.simulations (user_id);

-- ---------------------------------------------------------------------------
-- Raw per-event metrics view (cohort = users who signed up via that event).
-- Composite ROI scoring/normalization happens in app code (lib/roi.ts) so the
-- weights stay tunable from the UI.
-- ---------------------------------------------------------------------------

create or replace view public.event_metrics as
with cohort as (
  select e.id as event_id, u.id as user_id
  from public.events e
  left join public.users u on u.signup_event_id = e.id
),
sim_counts as (
  select c.event_id,
         count(s.id)                                  as sims,
         count(distinct s.user_id)                    as users_simulated
  from cohort c
  left join public.simulations s on s.user_id = c.user_id
  group by c.event_id
),
conn_counts as (
  select event_id, count(*) as conns
  from public.connections
  group by event_id
),
-- Distinct cohort users who appear in >=1 connection for their signup event.
conn_users as (
  select c.event_id, count(distinct u.user_id) as users_connected
  from cohort u
  join public.connections c
    on c.event_id = u.event_id
   and (c.user_a_id = u.user_id or c.user_b_id = u.user_id)
  group by c.event_id
),
user_counts as (
  select event_id, count(user_id) as new_users
  from cohort
  group by event_id
)
select
  e.id            as event_id,
  e.name,
  e.type,
  e.city,
  e.country,
  e.region,
  e.lat,
  e.lng,
  e.start_date,
  e.end_date,
  e.cost,
  e.is_wuerth,
  coalesce(uc.new_users, 0)                                          as new_users,
  coalesce(cc.conns, 0)                                              as total_connections,
  coalesce(sc.sims, 0)                                               as total_simulations,
  case when coalesce(uc.new_users, 0) = 0 then 0
       else coalesce(cc.conns, 0)::numeric / uc.new_users end        as avg_connections,
  case when coalesce(uc.new_users, 0) = 0 then 0
       else coalesce(sc.sims, 0)::numeric / uc.new_users end         as avg_simulations,
  coalesce(cu.users_connected, 0)                                    as users_connected,
  coalesce(sc.users_simulated, 0)                                    as users_simulated
from public.events e
left join user_counts uc on uc.event_id = e.id
left join conn_counts cc on cc.event_id = e.id
left join conn_users  cu on cu.event_id = e.id
left join sim_counts  sc on sc.event_id = e.id;

-- ---------------------------------------------------------------------------
-- Row Level Security: dashboard reads via the service role (server only).
-- Anon key gets read-only access to events + the metrics view for convenience.
-- ---------------------------------------------------------------------------

alter table public.events       enable row level security;
alter table public.users        enable row level security;
alter table public.connections  enable row level security;
alter table public.simulations  enable row level security;

drop policy if exists "events readable" on public.events;
create policy "events readable" on public.events for select using (true);
