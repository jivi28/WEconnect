-- Admin.jsx (the QR admin overview) queries `event_metrics(event_id, new_users)`
-- to show signup counts per event. That table/view never existed in any
-- migration on either branch — on the original qrcode branch it was created
-- ad hoc directly on the live Supabase project and never dumped to a
-- migration file. Without this, the query 404s, is swallowed by the
-- `if (!mx.error)` guard, and every event silently shows "0" signups.
create or replace view public.event_metrics as
select event_id, count(*) as new_users
from public.user_events
group by event_id;

grant select on public.event_metrics to authenticated;

-- The view is security_invoker (Postgres 15+ default for plain views), so it
-- still goes through user_events' RLS. The existing select policy there
-- checks role = 'admin', which can never match (same dead-role bug fixed for
-- `events` in migration 0005) — so a wurth_employee querying event_metrics
-- would only ever see their own registration, never aggregate counts.
drop policy if exists "Users see their own event history, admins see all" on public.user_events;
create policy "Users see their own event history, wurth employees see all"
on public.user_events for select to authenticated
using (
  auth.uid() = user_id
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'wurth_employee')
);
