-- Event QR feature: add hosts, slides, and a stable per-event QR token.
alter table public.events
  add column if not exists host_ids uuid[] not null default '{}',
  add column if not exists slides_path text,
  add column if not exists qr_token text;

-- Backfill tokens for existing rows.
update public.events
  set qr_token = replace(gen_random_uuid()::text, '-', '')
  where qr_token is null;

-- Enforce uniqueness + default for new rows (one stable QR per event).
alter table public.events
  alter column qr_token set default replace(gen_random_uuid()::text, '-', ''),
  alter column qr_token set not null;

create unique index if not exists events_qr_token_key on public.events (qr_token);
