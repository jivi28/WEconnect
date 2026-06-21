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
drop policy if exists "Profiles are viewable by authenticated users" on profiles;
create policy "Profiles are viewable by authenticated users"
  on profiles for select
  to authenticated
  using (true);

-- You can only create/update your own profile row.
drop policy if exists "Users can insert their own profile" on profiles;
create policy "Users can insert their own profile"
  on profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on profiles;
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

drop policy if exists "Network profiles are viewable by authenticated users" on network_profiles;
create policy "Network profiles are viewable by authenticated users"
  on network_profiles for select
  to authenticated
  using (true);

drop policy if exists "Users can upsert their own network profile" on network_profiles;
create policy "Users can upsert their own network profile"
  on network_profiles for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own network profile" on network_profiles;
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

drop policy if exists "Users can view their own connections" on connections;
create policy "Users can view their own connections"
  on connections for select
  to authenticated
  using (auth.uid() = user_a or auth.uid() = user_b);

drop policy if exists "Users can create connections involving themselves" on connections;
create policy "Users can create connections involving themselves"
  on connections for insert
  to authenticated
  with check (auth.uid() = initiated_by and (auth.uid() = user_a or auth.uid() = user_b));

drop policy if exists "Either party can update a connection's status" on connections;
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

drop policy if exists "Events are viewable by authenticated users" on events;
create policy "Events are viewable by authenticated users"
  on events for select to authenticated using (true);

drop policy if exists "Wurth employees can create events" on events;
create policy "Wurth employees can create events"
  on events for insert to authenticated
  with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'wurth_employee'));

drop policy if exists "Wurth employees can update events" on events;
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

drop policy if exists "Users see their own event history, admins see all" on user_events;
create policy "Users see their own event history, admins see all"
  on user_events for select to authenticated
  using (auth.uid() = user_id or exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

drop policy if exists "Users can add themselves to an event" on user_events;
create policy "Users can add themselves to an event"
  on user_events for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can remove themselves from an event" on user_events;
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

drop policy if exists "Projects are viewable by authenticated users" on projects;
create policy "Projects are viewable by authenticated users"
  on projects for select to authenticated using (true);

drop policy if exists "Authenticated users can create projects" on projects;
create policy "Authenticated users can create projects"
  on projects for insert to authenticated with check (true);

create table if not exists project_members (
  project_id uuid not null references projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

alter table project_members enable row level security;

drop policy if exists "Project membership is viewable by authenticated users" on project_members;
create policy "Project membership is viewable by authenticated users"
  on project_members for select to authenticated using (true);

drop policy if exists "Users can join a project themselves" on project_members;
create policy "Users can join a project themselves"
  on project_members for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can leave a project themselves" on project_members;
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

drop policy if exists "Users insert their own onboarding response" on onboarding_responses;
create policy "Users insert their own onboarding response"
  on onboarding_responses for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users read their own onboarding response" on onboarding_responses;
create policy "Users read their own onboarding response"
  on onboarding_responses for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Wurth employees read all onboarding responses" on onboarding_responses;
create policy "Wurth employees read all onboarding responses"
  on onboarding_responses for select
  to authenticated
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'wurth_employee'));

-- 7. Project ownership — needed so the public/private visibility toggle has
-- someone authorized to flip it. There was previously no UPDATE policy on
-- projects at all.
alter table projects add column if not exists owner_id uuid references auth.users (id);

drop policy if exists "Owners can update their own project" on projects;
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

drop policy if exists "Event attendance is viewable by authenticated users" on user_events;
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

drop policy if exists "Wurth employees can view CV storage objects" on storage.objects;
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

drop policy if exists "Students can upload their own CV" on storage.objects;
create policy "Students can upload their own CV"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'cvs'
    and owner = auth.uid()
    and exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'student')
  );

drop policy if exists "Students can replace or remove their own CV" on storage.objects;
create policy "Students can replace or remove their own CV"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'cvs' and owner = auth.uid());

drop policy if exists "Students can delete their own CV" on storage.objects;
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

-- 14. Row visibility was still "any authenticated user sees every row" on
-- profiles and network_profiles (section 1/2's "using (true)" policies) —
-- that's the same leak section 12 closed for email, just for everything
-- else (name, interests, role_data, ...). Students could browse other
-- students' rows, educators other educators', even though the mind map's
-- UI never offered that filter. Lock it down to mirror get_profile_emails:
-- everyone sees their own row and any wurth_employee's row; wurth_employee
-- accounts see everyone. Students/educators never see peer rows (same role,
-- not themself), only each other's existence is hidden, not wurth_employee's.
--
-- A naive "exists (select 1 from profiles where ...)" inside profiles' own
-- select policy makes Postgres re-evaluate that same policy on the inner
-- query, which re-triggers the subquery, forever — "infinite recursion
-- detected in policy for relation profiles" (42P17). Routing the lookup
-- through a SECURITY DEFINER function sidesteps this the same way
-- get_profile_email already does: the function runs as the table owner,
-- who isn't subject to RLS, so the inner read never re-enters the policy.
create or replace function public.profile_role(target_id uuid)
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from profiles where id = target_id;
$$;

grant execute on function public.profile_role(uuid) to authenticated;

drop policy if exists "Profiles are viewable by authenticated users" on profiles;
drop policy if exists "Profiles are viewable based on role visibility" on profiles;
create policy "Profiles are viewable based on role visibility"
  on profiles for select
  to authenticated
  using (
    auth.uid() = id
    or role = 'wurth_employee'
    or public.profile_role(auth.uid()) = 'wurth_employee'
  );

drop policy if exists "Network profiles are viewable by authenticated users" on network_profiles;
drop policy if exists "Network profiles are viewable based on role visibility" on network_profiles;
create policy "Network profiles are viewable based on role visibility"
  on network_profiles for select
  to authenticated
  using (
    auth.uid() = user_id
    or public.profile_role(network_profiles.user_id) = 'wurth_employee'
    or public.profile_role(auth.uid()) = 'wurth_employee'
  );

grant execute on function public.get_profile_emails(uuid[]) to authenticated;

-- 15. Profile highlights (events + project highlight reel) and the
-- Events/Projects page rework. Event "going" vs "attended" status is
-- derived client-side from event_date vs now (no extra column needed), but
-- "who's hosting" requires a real organizer reference, and both events and
-- projects need somewhere to point a thumbnail image once one exists (e.g.
-- the simulation module rendering a built structure) — nullable so the UI
-- can fall back to a placeholder until that's populated.
alter table events add column if not exists organizer_id uuid references auth.users (id);
alter table events add column if not exists thumbnail_url text;

alter table projects add column if not exists thumbnail_url text;
alter table projects add column if not exists status text not null default 'ongoing'
  check (status in ('ongoing', 'past'));

-- 16. Leaderboard handle, separate from `name`. `name` (section 1) stays
-- whatever the real-world identity is (used e.g. for CV/recruiting context);
-- `username` is the public handle shown on the leaderboard, so it gets its
-- own unique constraint and its own column grant (mirrors the section 12/14
-- pattern: authenticated only ever gets SELECT on an explicit column list,
-- never a blanket one). Column starts nullable here only so this ALTER
-- doesn't fail against existing rows — section 18 below backfills them and
-- then locks it to NOT NULL, so by the end of this file nobody can have an
-- account without one.
alter table profiles add column if not exists username text;

alter table profiles drop constraint if exists profiles_username_unique;
alter table profiles add constraint profiles_username_unique unique (username);

grant select (username) on public.profiles to authenticated;

-- handle_new_user() (section 11) needs to read the new field out of signup
-- metadata too, or every account created after this migration would have
-- a null username regardless of what the signup form sent.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, role, role_data, source_event_id, verification_status, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    coalesce(new.raw_user_meta_data->'role_data', '{}'::jsonb),
    (new.raw_user_meta_data->>'source_event_id')::uuid,
    coalesce(new.raw_user_meta_data->>'verification_status', 'pending'),
    new.raw_user_meta_data->>'username'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 17. The "which event brought you here" dropdown on the signup form runs
-- before the visitor has a session (signUp() hasn't been called yet), so
-- the existing "to authenticated" select policy on events silently hid the
-- whole catalog from it — the query didn't error, it just came back empty
-- under RLS. Events aren't sensitive, so let anon read them too.
drop policy if exists "Events are viewable by anyone, including pre-signup visitors" on events;
create policy "Events are viewable by anyone, including pre-signup visitors"
  on events for select
  to anon
  using (true);

-- 18. Section 16 left `username` nullable so the migration itself wouldn't
-- fail on pre-existing rows. That's no longer good enough: username has to
-- be mandatory at signup with no way around it, not just an HTML `required`
-- attribute the client can skip by hitting the API directly. A NOT NULL
-- column constraint is the only place that's actually unavoidable — it
-- fails the whole signUp() call (handle_new_user's insert rolls back inside
-- the same transaction as the auth.users row) if no username was sent.
-- Backfill first so the constraint doesn't reject rows that predate this
-- migration; those accounts can rename via the profile page afterward.
update profiles set username = 'user-' || substr(id::text, 1, 8) where username is null;

alter table profiles alter column username set not null;

-- NOT NULL alone still lets an empty string through (it's a value, just not
-- a useful one) — block that too so "must be sent" can't be satisfied by
-- submitting a blank field.
alter table profiles drop constraint if exists profiles_username_not_blank;
alter table profiles add constraint profiles_username_not_blank check (length(trim(username)) > 0);
