-- ============================================================================
-- Add EXCLUDE constraint: only one open attendance session per event
-- Requires btree_gist extension for combining = and boolean comparisons
-- ============================================================================

create extension if not exists "btree_gist";

alter table public.attendance_sessions
  add constraint one_open_session_per_event
  exclude using gist (
    event_id with =
  ) where (is_open = true);
