-- The original policies (on the qrcode branch) checked role = 'admin', which
-- can never match (the profiles.role CHECK only allows
-- student/educator/wurth_employee). This network branch's schema.sql never
-- had that bug — it already created "Wurth employees can create/update
-- events" directly — so also drop those exact names before recreating them
-- below, or CREATE POLICY errors with "policy already exists".
drop policy if exists "Admins can create events" on public.events;
drop policy if exists "Admins can update events" on public.events;
drop policy if exists "Wurth employees can create events" on public.events;
drop policy if exists "Wurth employees can update events" on public.events;
drop policy if exists "Wurth employees and hosts can update events" on public.events;

create policy "Wurth employees can create events"
on public.events for insert to authenticated
with check (
  exists (select 1 from public.profiles p
          where p.id = auth.uid() and p.role = 'wurth_employee')
);

create policy "Wurth employees and hosts can update events"
on public.events for update to authenticated
using (
  exists (select 1 from public.profiles p
          where p.id = auth.uid() and p.role = 'wurth_employee')
  or auth.uid() = any(host_ids)
)
with check (
  exists (select 1 from public.profiles p
          where p.id = auth.uid() and p.role = 'wurth_employee')
  or auth.uid() = any(host_ids)
);
