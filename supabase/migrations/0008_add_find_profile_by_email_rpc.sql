-- Event hosts are added by email (routes/AdminEvent.jsx addHost). The email
-- column has no direct SELECT grant for `authenticated` (see schema.sql's
-- "Email must be hidden from students/educators server-side" migration) —
-- a plain `.eq('email', ...)` lookup needs to read that column to evaluate
-- the filter, so it's rejected with "permission denied for table profiles"
-- before RLS even runs. This mirrors get_profile_email's pattern in reverse:
-- caller must be wurth_employee, function runs as table owner so the
-- column-level grant doesn't apply inside it.
create or replace function public.find_profile_by_email(target_email text)
returns table (id uuid, name text, email text, role text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'wurth_employee'
  ) then
    return;
  end if;

  return query
  select p.id, p.name, p.email, p.role
  from profiles p
  where p.email = target_email;
end;
$$;

grant execute on function public.find_profile_by_email(text) to authenticated;
