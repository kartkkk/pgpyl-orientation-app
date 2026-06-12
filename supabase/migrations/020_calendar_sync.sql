-- ─── Calendar Sync Log ──────────────────────────────────────────────────────
-- Tracks per-user Outlook calendar sync status for each event.
-- One app event → many Outlook calendar entries (one per recipient).
-- The on-event-change edge function is triggered via a Supabase Dashboard webhook
-- on the events table (INSERT / UPDATE / DELETE).

create table public.calendar_sync_log (
  id                uuid         primary key default gen_random_uuid(),
  event_id          uuid         not null references public.events(id) on delete cascade,
  profile_id        uuid         not null references public.profiles(id) on delete cascade,
  outlook_event_id  text,
  status            text         not null default 'pending'
                                 check (status in ('pending', 'synced', 'failed')),
  operation         text         not null
                                 check (operation in ('create', 'update', 'delete')),
  error             text,
  created_at        timestamptz  not null default now(),
  synced_at         timestamptz,
  unique (event_id, profile_id)
);

create index idx_calendar_sync_event  on public.calendar_sync_log(event_id);
create index idx_calendar_sync_failed on public.calendar_sync_log(status) where status = 'failed';

-- RLS: only service role accesses this table (edge functions use service role key)
alter table public.calendar_sync_log enable row level security;
