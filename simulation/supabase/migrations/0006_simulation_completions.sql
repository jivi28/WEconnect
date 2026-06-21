-- WEconnect — Simulator: per-account "simulations completed" counter.
-- Run once in the Supabase SQL Editor (Dashboard → SQL Editor → New query → Run).
-- Additive + idempotent; safe to re-run. Independent of the weekly-challenge tables.
--
-- Logs one row each time a user FINISHES a guided simulation (any product,
-- including weekly challenges). The simulations page reads a per-user count
-- from here to show "N simulations completed" in the top bar. The count is
-- personal, so reads are scoped to the owner — no public/leaderboard exposure.

create table if not exists public.wc_simulation_completions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  product    text,
  created_at timestamptz not null default now()
);

create index if not exists wc_simulation_completions_user_idx
  on public.wc_simulation_completions (user_id);

alter table public.wc_simulation_completions enable row level security;

-- A user can log their own completions and read their own count.
drop policy if exists "wc_sim_completions_insert_own" on public.wc_simulation_completions;
create policy "wc_sim_completions_insert_own" on public.wc_simulation_completions
  for insert with check (auth.uid() = user_id);

drop policy if exists "wc_sim_completions_select_own" on public.wc_simulation_completions;
create policy "wc_sim_completions_select_own" on public.wc_simulation_completions
  for select using (auth.uid() = user_id);
