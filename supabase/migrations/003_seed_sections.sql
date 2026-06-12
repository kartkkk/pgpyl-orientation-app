-- ============================================================================
-- PGP YL O-Week — Seed Section Data
-- ============================================================================

insert into public.sections (code, name) values
  ('A', 'Section A'),
  ('B', 'Section B')
on conflict (code) do nothing;

-- ─── Seed Initial Admins ────────────────────────────────────────────────────
-- After your admin users sign up via Supabase Auth, run this to promote them:
--
--   UPDATE public.profiles
--   SET role = 'admin', section_id = NULL
--   WHERE email IN ('admin1@isb.edu', 'admin2@isb.edu');
--
-- Replace the emails above with your actual admin email addresses.
