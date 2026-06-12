-- ============================================================================
-- Inside The Atrium — Enable pg_cron + pg_net extensions
-- The actual cron job schedules must be created via the Supabase Dashboard
-- SQL Editor since they reference the project URL and service role key.
-- See: supabase/snippets/setup_cron_jobs.sql
-- ============================================================================

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net  with schema extensions;

grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;
