-- An event with zero hosts is unmanageable (nobody left who can upload
-- slides, add a co-host, etc., short of falling back to "any wurth_employee"
-- which the UI doesn't expose). routes/AdminEvent.jsx's removeHost() already
-- blocks this client-side, but that's just UX — enforce it for real here so
-- a direct API call (or future code path) can't leave an event hostless.
--
-- A trigger, not a CHECK constraint: a CHECK is validated against ALL
-- existing rows the moment it's added, which would fail outright if any
-- pre-existing event already has an empty host_ids (e.g. one created before
-- the host concept existed). A trigger only inspects the specific write
-- being made, so it blocks "drop the last host" going forward without
-- touching rows that already have none.
create or replace function public.prevent_empty_event_hosts()
returns trigger
language plpgsql
as $function$
begin
  if coalesce(array_length(new.host_ids, 1), 0) = 0
     and coalesce(array_length(old.host_ids, 1), 0) > 0 then
    raise exception 'An event must have at least one host.';
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_prevent_empty_event_hosts on public.events;
create trigger trg_prevent_empty_event_hosts
before update on public.events
for each row execute function public.prevent_empty_event_hosts();
