-- Extend the signup trigger: attribute the new profile to its source event
-- (existing behavior) AND auto-register the attendee into user_events so event
-- slide access works regardless of email-confirmation/session timing.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_event_id uuid := (new.raw_user_meta_data->>'source_event_id')::uuid;
begin
  insert into public.profiles (id, name, email, role, role_data, source_event_id, verification_status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    coalesce(new.raw_user_meta_data->'role_data', '{}'::jsonb),
    v_event_id,
    coalesce(new.raw_user_meta_data->>'verification_status', 'pending')
  )
  on conflict (id) do nothing;

  -- Auto-register the attendee for the event that drove their signup (QR flow),
  -- so event slide access works regardless of session/confirmation timing.
  if v_event_id is not null then
    insert into public.user_events (user_id, event_id)
    values (new.id, v_event_id)
    on conflict (user_id, event_id) do nothing;
  end if;

  return new;
end;
$function$;

-- Trigger already exists on auth.users (on_auth_user_created); recreate if needed:
-- create trigger on_auth_user_created
--   after insert on auth.users
--   for each row execute function public.handle_new_user();
