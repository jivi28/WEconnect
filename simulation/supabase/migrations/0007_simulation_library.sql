-- WEconnect — Simulator: "My Library" of saved builds.
-- Run once in the Supabase SQL Editor (Dashboard → SQL Editor → New query → Run).
-- Additive + idempotent; safe to re-run. Assumes 0006_simulation_completions.sql ran.
--
-- Upgrades wc_simulation_completions so each completed simulation also stores
-- enough to reopen it later: the build mode, a display title, and the full
-- build snapshot (guided: SimulationData; free build: { componentIds }).
-- The existing owner-scoped RLS from 0006 already makes this a private library.

alter table public.wc_simulation_completions
  add column if not exists mode  text not null default 'guided',
  add column if not exists title text,
  add column if not exists data  jsonb;
