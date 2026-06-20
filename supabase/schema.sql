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
