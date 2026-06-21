-- public.events has RLS enabled (schema.sql) but never got a DELETE policy —
-- not in schema.sql, not in any later migration. Without one, every delete
-- silently matches zero rows: Postgres filters the row out before the
-- delete applies, and Supabase returns success (no error, no rows) rather
-- than rejecting the request. routes/AdminEvent.jsx's "Delete event" button
-- looked like it worked (it navigates away on no-error) but never removed
-- anything. Mirrors the insert/update policy from migration 0005.
create policy "Wurth employees and hosts can delete events"
on public.events for delete to authenticated
using (
  exists (select 1 from public.profiles p
          where p.id = auth.uid() and p.role = 'wurth_employee')
  or auth.uid() = any(host_ids)
);
