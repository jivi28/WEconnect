-- WEconnect — Weekly Challenge: points reflect performance, not a flat 1.
-- Run once in the Supabase SQL Editor (Dashboard → SQL Editor → New query → Run).
-- Assumes 0003_challenge_mistakes.sql already ran. Additive + idempotent.
--
-- Score per completion = max(10, 100 - seconds - mistakes*10) — faster, cleaner
-- solves earn more; finishing always pays at least 10. This MUST stay in lockstep
-- with scoreFor() in lib/weekly/scores.ts (the formula new inserts use).

-- 1. Per-completion score. New rows get it from the app (scoreFor); the default
--    of 1 only matters until the backfill below runs.
alter table public.wc_challenge_completions
  add column if not exists points integer not null default 1;

-- 2. Backfill existing rows with the same balanced formula.
update public.wc_challenge_completions
set points = greatest(
  10,
  100 - coalesce(floor(duration_ms / 1000.0)::int, 0) - coalesce(mistakes, 0) * 10
);

-- 3. Leaderboard points = SUM of per-completion scores (was count(*) = flat 1/week).
drop view if exists public.wc_leaderboard;
create view public.wc_leaderboard as
  select
    c.user_id,
    coalesce(p.name, 'Student')                 as display_name,
    coalesce(sum(c.points), 0)::int             as points,
    avg(c.duration_ms)::int                      as avg_ms,
    coalesce(sum(c.mistakes), 0)::int            as total_mistakes,
    coalesce(avg(c.mistakes), 0)::numeric(10, 2) as avg_mistakes,
    max(c.created_at)                            as last_completed
  from public.wc_challenge_completions c
  left join public.profiles p on p.id = c.user_id
  group by c.user_id, p.name;

grant select on public.wc_leaderboard to anon, authenticated;
