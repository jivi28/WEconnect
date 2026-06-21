-- WEconnect — Weekly Challenge: sync leaderboard to the real `profiles` table,
-- add solve-time, make the board live + public-readable.
-- Run once in the Supabase SQL Editor (Dashboard → SQL Editor → New query → Run).
-- Assumes 0001_weekly_challenge.sql already ran.

-- 1. Record how long each solve took (milliseconds).
alter table public.wc_challenge_completions
  add column if not exists duration_ms integer;

-- 2. Make completions publicly readable so the live board reflects everyone's
--    scores and Realtime can broadcast all inserts. Rows carry no PII
--    (user_id, week_key, product, time). Inserts stay locked to the owner.
drop policy if exists "wc_completions_select_own" on public.wc_challenge_completions;
drop policy if exists "wc_completions_select_all" on public.wc_challenge_completions;
create policy "wc_completions_select_all" on public.wc_challenge_completions
  for select using (true);

-- 3. Rebuild the leaderboard view: names from the canonical `profiles` table,
--    points = solves, avg_ms = average solve time. (drop+create because the
--    column set changes, which create-or-replace can't do.)
drop view if exists public.wc_leaderboard;
create view public.wc_leaderboard as
  select
    c.user_id,
    coalesce(p.name, 'Student') as display_name,
    count(*)                    as points,
    avg(c.duration_ms)::int     as avg_ms,
    max(c.created_at)           as last_completed
  from public.wc_challenge_completions c
  left join public.profiles p on p.id = c.user_id
  group by c.user_id, p.name;

grant select on public.wc_leaderboard to anon, authenticated;

-- 4. Enable Realtime on completions (ignore if already in the publication).
do $$
begin
  alter publication supabase_realtime add table public.wc_challenge_completions;
exception
  when duplicate_object then null;
end
$$;

-- 5. Drop the now-unused duplicate profile table + its trigger/function.
--    Safe: wc_challenge_completions.user_id references auth.users, not wc_profiles.
drop trigger if exists wc_on_auth_user_created on auth.users;
drop function if exists public.wc_handle_new_user();
drop table if exists public.wc_profiles;
