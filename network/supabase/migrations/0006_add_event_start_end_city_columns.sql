-- AdminEvent.jsx, Admin.jsx, and the event_by_qr_token RPC (migration 0003)
-- all read/write events.start_date, events.end_date, and events.city, but no
-- migration ever created them — schema.sql's events table only has
-- event_date. Without this, creating an event from the QR admin UI fails.
alter table public.events
  add column if not exists start_date date,
  add column if not exists end_date date,
  add column if not exists city text;
