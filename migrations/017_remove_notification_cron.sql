-- ============================================================================
-- Re-point the send-scheduled-notifications pg_cron job.
--
-- Old target: Supabase Edge Function (Expo Push API — dead after PWA migration)
-- New target: Vercel API route (Firebase FCM)
--
-- This migration removes the old job. The new job must be created manually
-- via the Supabase SQL Editor using supabase/snippets/setup_cron_jobs.sql
-- because it requires the production Vercel URL and CRON_SECRET, which are
-- deployment-specific and should not be committed to migrations.
-- ============================================================================

select cron.unschedule('send-scheduled-notifications');
