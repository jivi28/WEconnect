-- The original policies checked role = 'admin', which can never match (the
-- profiles.role CHECK only allows student/educator/wurth_employee). Replace with
-- the real privileged role plus event hosts.
drop policy if exists "Admins can create events" on public.events;
drop policy if exists "Admins can update events" on public.events;

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
