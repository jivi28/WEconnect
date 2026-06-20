-- Run this once in the Supabase dashboard: SQL Editor > New query > paste > Run.
-- Sets up the three tables the app needs and the security rules around them.

-- 1. Profiles: one row per user, holding the role and role-specific data.
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null,
  role text not null check (role in ('student', 'educator', 'wurth_employee')),
  role_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- Anyone logged in can view profiles (needed to show names on matches).
create policy "Profiles are viewable by authenticated users"
  on profiles for select
  to authenticated
  using (true);

-- You can only create/update your own profile row.
create policy "Users can insert their own profile"
  on profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  to authenticated
  using (auth.uid() = id);

-- 2. Network profiles: the interests/looking-for tags used for matching.
create table if not exists network_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  bio text default '',
  interests text[] not null default '{}',
  looking_for text[] not null default '{}',
  updated_at timestamptz not null default now()
);

alter table network_profiles enable row level security;

create policy "Network profiles are viewable by authenticated users"
  on network_profiles for select
  to authenticated
  using (true);

create policy "Users can upsert their own network profile"
  on network_profiles for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own network profile"
  on network_profiles for update
  to authenticated
  using (auth.uid() = user_id);

-- 3. Connections: a request/acceptance between two users.
create table if not exists connections (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references auth.users (id) on delete cascade,
  user_b uuid not null references auth.users (id) on delete cascade,
  initiated_by uuid not null references auth.users (id),
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now()
);

alter table connections enable row level security;

create policy "Users can view their own connections"
  on connections for select
  to authenticated
  using (auth.uid() = user_a or auth.uid() = user_b);

create policy "Users can create connections involving themselves"
  on connections for insert
  to authenticated
  with check (auth.uid() = initiated_by and (auth.uid() = user_a or auth.uid() = user_b));

create policy "Either party can update a connection's status"
  on connections for update
  to authenticated
  using (auth.uid() = user_a or auth.uid() = user_b);

-- 4. Events catalog (so analysis can aggregate cleanly, not parse free text)
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  event_date date,
  created_at timestamptz not null default now()
);

alter table events enable row level security;

create policy "Events are viewable by authenticated users"
  on events for select to authenticated using (true);

create policy "Wurth employees can create events"
  on events for insert to authenticated
  with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'wurth_employee'));

create policy "Wurth employees can update events"
  on events for update to authenticated
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'wurth_employee'));

-- Which event someone signed up through
alter table profiles add column if not exists source_event_id uuid references events (id);

-- Events someone has attended/participated in (separate from signup-source)
create table if not exists user_events (
  user_id uuid not null references auth.users (id) on delete cascade,
  event_id uuid not null references events (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);

alter table user_events enable row level security;

create policy "Users see their own event history, admins see all"
  on user_events for select to authenticated
  using (auth.uid() = user_id or exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

create policy "Users can add themselves to an event"
  on user_events for insert to authenticated with check (auth.uid() = user_id);

create policy "Users can remove themselves from an event"
  on user_events for delete to authenticated using (auth.uid() = user_id);

-- What educators can offer (separate column from students' looking_for)
alter table network_profiles add column if not exists offers text[] not null default '{}';

-- Minimal project stub — confirm real shape with whoever owns the simulation module
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

alter table projects enable row level security;

create policy "Projects are viewable by authenticated users"
  on projects for select to authenticated using (true);

create policy "Authenticated users can create projects"
  on projects for insert to authenticated with check (true);

create table if not exists project_members (
  project_id uuid not null references projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

alter table project_members enable row level security;

create policy "Project membership is viewable by authenticated users"
  on project_members for select to authenticated using (true);

create policy "Users can join a project themselves"
  on project_members for insert to authenticated with check (auth.uid() = user_id);

create policy "Users can leave a project themselves"
  on project_members for delete to authenticated using (auth.uid() = user_id);

-- 5. Matching v2: expertise/sought-educator tags, plus a cached snapshot of
-- each user's ranked matches so the list doesn't have to be recomputed on
-- every page load.
alter table network_profiles add column if not exists expertise_tags text[] not null default '{}';
alter table network_profiles add column if not exists sought_educators text[] not null default '{}';
alter table network_profiles add column if not exists cached_matches jsonb;
alter table network_profiles add column if not exists matches_generated_at timestamptz;

-- 6. One-time onboarding (student/educator only — wurth_employee skips it) and
-- per-project visibility for the public/private toggle on the map.
alter table profiles add column if not exists onboarding_completed boolean not null default false;

alter table projects add column if not exists visibility text not null default 'private'
  check (visibility in ('public', 'private'));

create table if not exists onboarding_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  event_id uuid references events (id),
  event_other text,
  event_rating smallint check (event_rating between 1 and 5),
  collaboration_interest text check (collaboration_interest in ('yes', 'maybe', 'no')),
  created_at timestamptz not null default now()
);

alter table onboarding_responses enable row level security;

create policy "Users insert their own onboarding response"
  on onboarding_responses for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users read their own onboarding response"
  on onboarding_responses for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Wurth employees read all onboarding responses"
  on onboarding_responses for select
  to authenticated
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'wurth_employee'));

-- 7. Project ownership — needed so the public/private visibility toggle has
-- someone authorized to flip it. There was previously no UPDATE policy on
-- projects at all.
alter table projects add column if not exists owner_id uuid references auth.users (id);

create policy "Owners can update their own project"
  on projects for update
  to authenticated
  using (auth.uid() = owner_id);

-- 8. Matching v3 needs to compare event attendance across users (the
-- activity-overlap signal in src/lib/matching.js), but the existing select
-- policy only ever returned the caller's own rows (or all rows, if the
-- caller is an admin) — so any non-admin fetching "everyone's" user_events
-- silently got back just their own attendance, making every other person's
-- eventIds look empty rather than unknown. Event attendance isn't sensitive
-- the way e.g. private messages are, so open it up the same way
-- project_members already is.
drop policy if exists "Users see their own event history, admins see all" on user_events;

create policy "Event attendance is viewable by authenticated users"
  on user_events for select to authenticated using (true);

-- 9. The 'admin' role was always actually the Würth Elektronik
-- representative persona (org auto-set to "Würth Elektronik", site/business
-- unit fields, "expert" mindmap label) — there was never a separate generic
-- superuser tier. Renamed to 'wurth_employee' so the name matches what the
-- role has always done, and so it reads as a normal third self-serve role
-- rather than an "admin" option that shouldn't be public-facing.
update profiles set role = 'wurth_employee' where role = 'admin';

alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check
  check (role in ('student', 'educator', 'wurth_employee'));

-- 10. Students only: a private CV upload, visible to the student themself
-- and to wurth_employee accounts (recruiting), nobody else. The file lives
-- in the private "cvs" storage bucket (created separately via the
-- dashboard/API — see README), gated by the storage policies below;
-- cv_file_path here is just the pointer used to generate signed URLs.
alter table profiles add column if not exists cv_file_path text;

-- Simulated university/staff verification (see src/pages/Signup.jsx): new
-- student/educator accounts start "pending" until the mock affiliation
-- check passes, then flip to "verified". wurth_employee accounts skip this
-- entirely since the check is about university affiliation.
alter table profiles add column if not exists verification_status text not null default 'pending'
  check (verification_status in ('pending', 'verified', 'rejected'));

update profiles set verification_status = 'verified' where role = 'wurth_employee';

insert into storage.buckets (id, name, public)
values ('cvs', 'cvs', false)
on conflict (id) do nothing;

create policy "Wurth employees can view CV storage objects"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'cvs'
    and (
      owner = auth.uid()
      or exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'wurth_employee')
    )
  );

create policy "Students can upload their own CV"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'cvs'
    and owner = auth.uid()
    and exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'student')
  );

create policy "Students can replace or remove their own CV"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'cvs' and owner = auth.uid());

create policy "Students can delete their own CV"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'cvs' and owner = auth.uid());

-- 11. Profile creation can't depend on the client holding an authenticated
-- session at insert time: when email confirmation is enabled (the Supabase
-- default), auth.signUp() returns a user but no session, so a client-side
-- insert into `profiles` right after signUp runs as the anon role and gets
-- rejected by the "auth.uid() = id" insert policy — breaking every signup.
-- A security-definer trigger on auth.users creates the row server-side
-- instead, independent of session state. Signup metadata (name, role,
-- role_data, source_event_id, verification_status — the last computed by
-- the mock university-affiliation check in Signup.jsx) is passed through
-- auth.signUp()'s options.data and read back here from raw_user_meta_data.
-- Must run after the role/verification_status columns above exist.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, role, role_data, source_event_id, verification_status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    coalesce(new.raw_user_meta_data->'role_data', '{}'::jsonb),
    (new.raw_user_meta_data->>'source_event_id')::uuid,
    coalesce(new.raw_user_meta_data->>'verification_status', 'pending')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 12. Email must be hidden from students/educators server-side, not just in
-- the UI — but RLS is row-level, not column-level, so the existing "select
-- using (true)" policy on profiles would let any authenticated user pull
-- everyone's email straight off the REST API regardless of what the
-- frontend chooses to render. Postgres column-level GRANTs are the actual
-- enforcement point: `authenticated` loses blanket SELECT on profiles and
-- is re-granted only the non-email columns, so a `select *` (or
-- select-email) against the base table is rejected outright for anyone.
-- The one legitimate path to an email — the row owner, or a wurth_employee
-- looking someone up — goes through this SECURITY DEFINER function, which
-- runs as the table owner and so isn't subject to the grant above.
revoke select on public.profiles from authenticated;
grant select (id, name, role, role_data, source_event_id, onboarding_completed, verification_status, cv_file_path, created_at)
  on public.profiles to authenticated;

create or replace function public.get_profile_email(target_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  result text;
begin
  if auth.uid() = target_id
    or exists (select 1 from profiles where id = auth.uid() and role = 'wurth_employee')
  then
    select email into result from profiles where id = target_id;
    return result;
  end if;
  return null;
end;
$$;

grant execute on function public.get_profile_email(uuid) to authenticated;

-- 13. Email visibility, take two: wurth_employee accounts use the network
-- map to find candidates and need a way to reach them, and students/
-- educators need a way to reach back — but never to see each other's email
-- (e.g. one student's email is never visible to another student/educator).
-- get_profile_email's "wurth_employee sees everyone" rule gets a mirror
-- rule for the reverse direction. get_profile_emails is a batched variant
-- of the same check so the mind map can fetch the whole visible set in one
-- round trip instead of one RPC call per node.
create or replace function public.get_profile_email(target_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_role text;
  target_role text;
  result text;
begin
  if auth.uid() = target_id then
    select email into result from profiles where id = target_id;
    return result;
  end if;

  select role into caller_role from profiles where id = auth.uid();
  select role into target_role from profiles where id = target_id;

  if caller_role = 'wurth_employee'
    or (caller_role in ('student', 'educator') and target_role = 'wurth_employee')
  then
    select email into result from profiles where id = target_id;
    return result;
  end if;

  return null;
end;
$$;

create or replace function public.get_profile_emails(target_ids uuid[])
returns table (id uuid, email text)
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_role text;
begin
  select role into caller_role from profiles where profiles.id = auth.uid();

  return query
  select p.id, p.email
  from profiles p
  where p.id = any(target_ids)
    and (
      p.id = auth.uid()
      or caller_role = 'wurth_employee'
      or (caller_role in ('student', 'educator') and p.role = 'wurth_employee')
    );
end;
$$;

grant execute on function public.get_profile_emails(uuid[]) to authenticated;
