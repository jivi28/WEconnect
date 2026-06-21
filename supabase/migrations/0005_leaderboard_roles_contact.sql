-- WEconnect — Weekly Challenge: role-aware leaderboard with no PII leaks.
-- Run once in the Supabase SQL Editor (Dashboard → SQL Editor → New query → Run).
-- Assumes 0004_points_from_performance.sql already ran. Additive + idempotent.
--
-- Privacy model: the board exposes only the public handle (username) + role +
-- gameplay stats — NEVER name or email. Students therefore see usernames only.
-- Würth employees fetch name+email separately via wc_student_contact() below,
-- which is gated to wurth_employee callers (mirrors get_profile_emails()).

-- 1. Rebuild the view to surface username + role instead of the real name.
drop view if exists public.wc_leaderboard;
create view public.wc_leaderboard as
  select
    c.user_id,
    coalesce(p.username, 'student')             as username,
    coalesce(p.role, 'student')                 as role,
    coalesce(sum(c.points), 0)::int             as points,
    avg(c.duration_ms)::int                      as avg_ms,
    coalesce(sum(c.mistakes), 0)::int            as total_mistakes,
    coalesce(avg(c.mistakes), 0)::numeric(10, 2) as avg_mistakes,
    max(c.created_at)                            as last_completed
  from public.wc_challenge_completions c
  left join public.profiles p on p.id = c.user_id
  group by c.user_id, p.username, p.role;

grant select on public.wc_leaderboard to anon, authenticated;

-- 2. Employee-only contact lookup. Returns name + email for the given users
--    ONLY when the caller is a wurth_employee; everyone else gets zero rows.
create or replace function public.wc_student_contact(target_ids uuid[])
returns table (id uuid, name text, email text)
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_role text;
begin
  select role into caller_role from profiles where profiles.id = auth.uid();
  if caller_role is distinct from 'wurth_employee' then
    return; -- no rows for students / educators / anon
  end if;

  return query
  select p.id, p.name, p.email
  from profiles p
  where p.id = any(target_ids);
end;
$$;

grant execute on function public.wc_student_contact(uuid[]) to authenticated;
