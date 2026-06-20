-- Private bucket for event slide decks.
insert into storage.buckets (id, name, public)
values ('event-slides', 'event-slides', false)
on conflict (id) do nothing;

-- Object name convention: '<event_id>/<filename>' so (storage.foldername(name))[1] = event id.

-- Download: wurth employees, the event's hosts, or attendees registered for it.
create policy "Registered attendees and hosts can read event slides"
on storage.objects for select to authenticated
using (
  bucket_id = 'event-slides' and (
    exists (select 1 from public.profiles p
            where p.id = auth.uid() and p.role = 'wurth_employee')
    or exists (select 1 from public.events e
               where e.id = ((storage.foldername(name))[1])::uuid
                 and auth.uid() = any(e.host_ids))
    or exists (select 1 from public.user_events ue
               where ue.user_id = auth.uid()
                 and ue.event_id = ((storage.foldername(name))[1])::uuid)
  )
);

-- Manage (upload / replace / delete): wurth employees or the event's hosts only.
create policy "Hosts and wurth employees can insert event slides"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'event-slides' and (
    exists (select 1 from public.profiles p
            where p.id = auth.uid() and p.role = 'wurth_employee')
    or exists (select 1 from public.events e
               where e.id = ((storage.foldername(name))[1])::uuid
                 and auth.uid() = any(e.host_ids))
  )
);

create policy "Hosts and wurth employees can update event slides"
on storage.objects for update to authenticated
using (
  bucket_id = 'event-slides' and (
    exists (select 1 from public.profiles p
            where p.id = auth.uid() and p.role = 'wurth_employee')
    or exists (select 1 from public.events e
               where e.id = ((storage.foldername(name))[1])::uuid
                 and auth.uid() = any(e.host_ids))
  )
);

create policy "Hosts and wurth employees can delete event slides"
on storage.objects for delete to authenticated
using (
  bucket_id = 'event-slides' and (
    exists (select 1 from public.profiles p
            where p.id = auth.uid() and p.role = 'wurth_employee')
    or exists (select 1 from public.events e
               where e.id = ((storage.foldername(name))[1])::uuid
                 and auth.uid() = any(e.host_ids))
  )
);
