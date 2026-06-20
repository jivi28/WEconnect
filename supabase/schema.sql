-- Run this once in the Supabase dashboard: SQL Editor > New query > paste > Run.
-- Sets up the three tables the app needs and the security rules around them.

-- 1. Profiles: one row per user, holding the role and role-specific data.
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null,
  role text not null check (role in ('student', 'educator', 'admin')),
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

create policy "Admins can create events"
  on events for insert to authenticated
  with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

create policy "Admins can update events"
  on events for update to authenticated
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

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
