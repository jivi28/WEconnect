-- WEconnect — "Copy email = connection" + analytics re-point
-- ---------------------------------------------------------------------------
-- The old request/accept "Connect" feature was removed, so the connections
-- metric stopped incrementing. We now treat a recruiter (Würth employee)
-- copying a student's email/contact as a connection: every copy is logged in
-- wc_email_copies, which (a) is the student's connection count and (b) feeds
-- the event-analytics engagement funnel.
--
-- Additive + idempotent: only CREATEs a new table and recreates the existing
-- event_metrics view (re-pointing just its connections source). Safe to re-run.
-- Run once in the Supabase SQL Editor, or via `supabase db push`.
-- ---------------------------------------------------------------------------

-- 1) wc_email_copies — one row each time a recruiter copies a student's email.
--    `student_id` is the person whose contact was copied (their connection
--    count); `copier_id` is who copied it; `surface` is where it happened.
create table if not exists public.wc_email_copies (
  id         uuid primary key default gen_random_uuid(),
  copier_id  uuid references auth.users (id) on delete set null,
  student_id uuid not null references auth.users (id) on delete cascade,
  surface    text check (surface in ('explore_map', 'sim_leaderboard')),
  created_at timestamptz not null default now()
);

create index if not exists wc_email_copies_student_idx
  on public.wc_email_copies (student_id);
create index if not exists wc_email_copies_copier_idx
  on public.wc_email_copies (copier_id);

alter table public.wc_email_copies enable row level security;

-- A signed-in user logs their own copies; the copier and the copied student
-- can each read the rows that involve them. The analytics dashboard reads via
-- the service-role client, which bypasses RLS.
drop policy if exists "wc_email_copies_insert_own" on public.wc_email_copies;
create policy "wc_email_copies_insert_own" on public.wc_email_copies
  for insert with check (auth.uid() = copier_id);

drop policy if exists "wc_email_copies_select_involved" on public.wc_email_copies;
create policy "wc_email_copies_select_involved" on public.wc_email_copies
  for select using (auth.uid() = copier_id or auth.uid() = student_id);

-- 2) Recreate event_metrics (from 0011) with the `conns` CTE re-pointed at
--    wc_email_copies, attributed to the STUDENT whose email was copied. Every
--    other CTE/column is unchanged from 0011.
--      * total_connections = copies of students who joined via that event
--      * users_connected   = distinct students copied who joined via that event
create or replace view public.event_metrics as
with signups as (
  select source_event_id as event_id,
         count(*)::int    as new_users
  from public.profiles
  where source_event_id is not null
  group by source_event_id
),
conns as (
  select p.source_event_id                  as event_id,
         count(*)::int                       as total_connections,
         count(distinct ec.student_id)::int  as users_connected
  from public.wc_email_copies ec
  join public.profiles p on p.id = ec.student_id
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

grant select on public.event_metrics to anon, authenticated, service_role;
