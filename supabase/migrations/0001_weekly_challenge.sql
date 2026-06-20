-- WEconnect — Weekly Challenge leaderboard schema
-- Run once in the Supabase SQL Editor (Dashboard → SQL Editor → New query → paste → Run).
--
-- NOTE: This project already has its own `profiles` table + signup trigger for
-- another app. Everything here is namespaced with a `wc_` prefix and adds its
-- OWN trigger, so it never touches or overrides the existing schema.
-- Safe to re-run.

-- 1. Profiles: one row per auth user, holds the public display name.
create table if not exists public.wc_profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  created_at   timestamptz not null default now()
);

-- 2. Challenge completions: one row each time a user solves a weekly challenge.
--    The unique (user_id, week_key) constraint caps it at one point per week.
create table if not exists public.wc_challenge_completions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  week_key   text not null,            -- e.g. "2026-W25"
  product    text not null,            -- the assigned product that week
  created_at timestamptz not null default now(),
  unique (user_id, week_key)
);

-- 3. Auto-create a wc_profile whenever a user signs up (separate trigger so it
--    coexists with any existing on_auth_user_created trigger).
create or replace function public.wc_handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.wc_profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists wc_on_auth_user_created on auth.users;
create trigger wc_on_auth_user_created
  after insert on auth.users
  for each row execute function public.wc_handle_new_user();

-- 3b. Backfill profiles for users who already exist.
insert into public.wc_profiles (id, display_name)
select
  u.id,
  coalesce(nullif(u.raw_user_meta_data ->> 'display_name', ''), split_part(u.email, '@', 1))
from auth.users u
on conflict (id) do nothing;

-- 4. Row Level Security.
alter table public.wc_profiles enable row level security;
alter table public.wc_challenge_completions enable row level security;

drop policy if exists "wc_profiles_select_all" on public.wc_profiles;
create policy "wc_profiles_select_all" on public.wc_profiles
  for select using (true);

drop policy if exists "wc_profiles_update_own" on public.wc_profiles;
create policy "wc_profiles_update_own" on public.wc_profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "wc_completions_insert_own" on public.wc_challenge_completions;
create policy "wc_completions_insert_own" on public.wc_challenge_completions
  for insert with check (auth.uid() = user_id);

drop policy if exists "wc_completions_select_own" on public.wc_challenge_completions;
create policy "wc_completions_select_own" on public.wc_challenge_completions
  for select using (auth.uid() = user_id);

-- 5. Public leaderboard view (aggregates past RLS via the view owner's rights).
create or replace view public.wc_leaderboard as
  select
    p.id              as user_id,
    p.display_name,
    count(c.id)       as points,
    max(c.created_at) as last_completed
  from public.wc_profiles p
  left join public.wc_challenge_completions c on c.user_id = p.id
  group by p.id, p.display_name;

grant select on public.wc_leaderboard to anon, authenticated;
