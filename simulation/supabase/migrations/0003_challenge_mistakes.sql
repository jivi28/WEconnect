-- WEconnect — Weekly Challenge: penalize wrong placements in the ranking.
-- Run once in the Supabase SQL Editor (Dashboard → SQL Editor → New query → Run).
-- Assumes 0002_leaderboard_sync.sql already ran. Additive + idempotent.

-- 1. Count the wrong placements a solver made before completing the puzzle.
--    Existing rows default to 0, so current standings are unaffected.
alter table public.wc_challenge_completions
  add column if not exists mistakes integer not null default 0;

-- 2. Rebuild the leaderboard view to expose mistake counts alongside time.
--    The actual penalty (effective time = avg_ms + avg_mistakes * PENALTY_MS) is
--    applied client-side in lib/weekly/scores.ts so it stays tunable without a
--    migration; the view just surfaces the raw aggregates.
drop view if exists public.wc_leaderboard;
create view public.wc_leaderboard as
  select
    c.user_id,
    coalesce(p.name, 'Student')                 as display_name,
    count(*)                                     as points,
    avg(c.duration_ms)::int                      as avg_ms,
    coalesce(sum(c.mistakes), 0)::int            as total_mistakes,
    coalesce(avg(c.mistakes), 0)::numeric(10, 2) as avg_mistakes,
    max(c.created_at)                            as last_completed
  from public.wc_challenge_completions c
  left join public.profiles p on p.id = c.user_id
  group by c.user_id, p.name;

grant select on public.wc_leaderboard to anon, authenticated;
