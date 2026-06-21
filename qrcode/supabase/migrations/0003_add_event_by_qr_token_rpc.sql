-- Anon-readable resolver so the QR registration page can show the event name
-- before the visitor signs in. Returns only minimal, non-sensitive fields.
create or replace function public.event_by_qr_token(token text)
returns table (id uuid, name text, event_date date)
language sql
security definer
set search_path to 'public'
as $function$
  select e.id, e.name, coalesce(e.event_date, e.start_date) as event_date
  from public.events e
  where e.qr_token = token
  limit 1;
$function$;

revoke all on function public.event_by_qr_token(text) from public;
grant execute on function public.event_by_qr_token(text) to anon, authenticated;
