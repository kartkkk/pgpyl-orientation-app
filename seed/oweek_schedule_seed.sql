-- ============================================================================
-- PGP YL O-Week — Schedule seed (Sat 13 June – Sun 21 June 2026, IST)
-- ============================================================================
-- Run ONCE in the Supabase SQL editor AFTER at least one admin profile exists.
-- It auto-assigns `created_by` to your earliest admin and skips if O-Week
-- events already exist (so it won't duplicate on re-run).
--
-- NOTES
--  • Times are transcribed from the O-Week approval grid and are a best-effort
--    read — verify against your master sheet and adjust as needed (easiest via
--    the in-app Edit Event screen).
--  • Section-specific sessions are labelled "(Section A)" / "(Section B)".
--    Tentative items are labelled "(Tentative)".
--  • Venues are set to match the app's directions metadata where known, so the
--    "Open in Google Maps" link appears automatically.
--  • To show a session to only one section instead of everyone, set its
--    visibility to 'section' and add an event_assignments row for that section.
-- ============================================================================

do $$
declare
  admin_id uuid;
begin
  select id into admin_id
  from public.profiles
  where role = 'admin'
  order by created_at
  limit 1;

  if admin_id is null then
    raise exception 'No admin profile found. Promote an admin first (see 003_seed_sections.sql).';
  end if;

  if exists (
    select 1 from public.events
    where starts_at >= '2026-06-13 00:00:00+05:30'
      and starts_at <  '2026-06-22 00:00:00+05:30'
  ) then
    raise notice 'O-Week events already present — skipping seed.';
    return;
  end if;

  insert into public.events (title, description, venue, starts_at, ends_at, visibility, created_by) values
  -- ── Sat 13 June — Registration Day ───────────────────────────────────────
  ('Arrival on Campus', 'Check in to your accommodation, then report for registration.', 'Motilal Oswal Executive Centre', '2026-06-13 09:00:00+05:30', '2026-06-13 14:00:00+05:30', 'all', admin_id),
  ('Registration', 'ASA, Admissions & Finance. Carry original documents.', 'Lecture Theatre 3 (LT3)', '2026-06-13 14:00:00+05:30', '2026-06-13 16:00:00+05:30', 'all', admin_id),
  ('Campus Tour (Y1 Volunteers)', null, 'Motilal Oswal Executive Centre', '2026-06-13 16:00:00+05:30', '2026-06-13 17:30:00+05:30', 'all', admin_id),
  ('Welcome Address — Dean', 'Dean Madan Pillutla.', 'Khemka Auditorium', '2026-06-13 18:00:00+05:30', '2026-06-13 18:30:00+05:30', 'all', admin_id),
  ('Welcome Address — Associate Dean', 'Prof. Sripad Devalkar, Associate Dean (Programmes).', 'Khemka Auditorium', '2026-06-13 18:30:00+05:30', '2026-06-13 19:00:00+05:30', 'all', admin_id),
  ('Welcome Dinner', 'Students, family & faculty.', 'Atrium', '2026-06-13 19:30:00+05:30', '2026-06-13 21:30:00+05:30', 'all', admin_id),

  -- ── Sun 14 June ──────────────────────────────────────────────────────────
  ('Overview of O-Week — Y2', null, null, '2026-06-14 09:30:00+05:30', '2026-06-14 10:00:00+05:30', 'all', admin_id),
  ('Panel Discussion — Industry Speakers', 'Moderated by faculty.', null, '2026-06-14 10:30:00+05:30', '2026-06-14 12:00:00+05:30', 'all', admin_id),
  ('Team Building — Squid Games & Dominoes', null, 'Recreation Centre', '2026-06-14 14:00:00+05:30', '2026-06-14 17:00:00+05:30', 'all', admin_id),
  ('Team Building by Y2 Students / KYP', null, null, '2026-06-14 17:30:00+05:30', '2026-06-14 18:30:00+05:30', 'all', admin_id),

  -- ── Mon 15 June ──────────────────────────────────────────────────────────
  ('AFA & ASA (Academic Affairs)', null, null, '2026-06-15 11:00:00+05:30', '2026-06-15 11:30:00+05:30', 'all', admin_id),
  ('HCC — Prof. Sudhir Voleti', null, null, '2026-06-15 11:30:00+05:30', '2026-06-15 12:00:00+05:30', 'all', admin_id),
  ('Acing the Case Study — Part CLTE', null, null, '2026-06-15 13:30:00+05:30', '2026-06-15 15:00:00+05:30', 'all', admin_id),
  ('Faculty Insights — Self-Leadership (Prof. Deboleena)', 'How to lead yourself to academic and career success.', null, '2026-06-15 15:00:00+05:30', '2026-06-15 16:00:00+05:30', 'all', admin_id),
  ('AAA Presentation', null, null, '2026-06-15 16:30:00+05:30', '2026-06-15 17:30:00+05:30', 'all', admin_id),

  -- ── Tue 16 June ──────────────────────────────────────────────────────────
  ('Operations, Brand & Social Media Guidelines & LAB (Tentative)', null, null, '2026-06-16 09:30:00+05:30', '2026-06-16 11:30:00+05:30', 'all', admin_id),
  ('Faculty Insights — Prof. Madhu V', null, null, '2026-06-16 12:30:00+05:30', '2026-06-16 13:30:00+05:30', 'all', admin_id),
  ('Maths Tutorials (Tentative) — Section A', null, null, '2026-06-16 14:00:00+05:30', '2026-06-16 15:00:00+05:30', 'all', admin_id),
  ('Maths Tutorials (Tentative) — Section B', null, null, '2026-06-16 17:00:00+05:30', '2026-06-16 18:00:00+05:30', 'all', admin_id),

  -- ── Wed 17 June ──────────────────────────────────────────────────────────
  ('Stats Tutorials (Tentative) — Section A', null, null, '2026-06-17 09:00:00+05:30', '2026-06-17 10:00:00+05:30', 'all', admin_id),
  ('Stats Tutorials (Tentative) — Section B', null, null, '2026-06-17 12:30:00+05:30', '2026-06-17 13:30:00+05:30', 'all', admin_id),
  ('Faculty Insights — Effective Class Participation (Prof. Deepak Jena)', null, null, '2026-06-17 14:30:00+05:30', '2026-06-17 15:30:00+05:30', 'all', admin_id),
  ('Sports / Networking', null, 'Sports Fields', '2026-06-17 15:30:00+05:30', '2026-06-17 17:00:00+05:30', 'all', admin_id),
  ('Session on D&I', null, null, '2026-06-17 17:30:00+05:30', '2026-06-17 18:00:00+05:30', 'all', admin_id),

  -- ── Thu 18 June ──────────────────────────────────────────────────────────
  ('Business Simulation — Team Activators', null, 'Khemka Auditorium', '2026-06-18 09:30:00+05:30', '2026-06-18 13:30:00+05:30', 'all', admin_id),
  ('Presentation by CAS', null, null, '2026-06-18 14:00:00+05:30', '2026-06-18 14:30:00+05:30', 'all', admin_id),
  ('Wellbeing Counselling — Swati, Zenobia & Smita', null, null, '2026-06-18 16:30:00+05:30', '2026-06-18 17:30:00+05:30', 'all', admin_id),
  ('GSB Panel Discussion', null, null, '2026-06-18 18:30:00+05:30', '2026-06-18 19:30:00+05:30', 'all', admin_id),
  ('Social Clubs Session', null, null, '2026-06-18 20:00:00+05:30', '2026-06-18 21:00:00+05:30', 'all', admin_id),

  -- ── Fri 19 June ──────────────────────────────────────────────────────────
  ('Professional Clubs Session', null, null, '2026-06-19 10:30:00+05:30', '2026-06-19 11:30:00+05:30', 'all', admin_id),
  ('Faculty Insights Session — Prof. Prasanna', null, null, '2026-06-19 11:30:00+05:30', '2026-06-19 12:30:00+05:30', 'all', admin_id),
  ('CASHD Session', null, null, '2026-06-19 13:00:00+05:30', '2026-06-19 14:00:00+05:30', 'all', admin_id),
  ('ASA Student Affairs', null, null, '2026-06-19 14:30:00+05:30', '2026-06-19 15:30:00+05:30', 'all', admin_id),
  ('ISB Trivia Quiz', null, null, '2026-06-19 16:00:00+05:30', '2026-06-19 17:00:00+05:30', 'all', admin_id),
  ('Ramoji Event', null, 'Ramoji Auditorium', '2026-06-19 17:30:00+05:30', '2026-06-19 18:30:00+05:30', 'all', admin_id),
  ('Canvas Painting (Time Capsule)', null, null, '2026-06-19 20:30:00+05:30', '2026-06-19 21:30:00+05:30', 'all', admin_id),

  -- ── Sat 20 June ──────────────────────────────────────────────────────────
  ('Alum Session — Panel Discussion on Impact Stories', null, null, '2026-06-20 10:30:00+05:30', '2026-06-20 11:30:00+05:30', 'all', admin_id),
  ('Alum Session — The Power of Setbacks', null, null, '2026-06-20 14:00:00+05:30', '2026-06-20 15:30:00+05:30', 'all', admin_id),
  ('Talent Night Prep', null, null, '2026-06-20 16:00:00+05:30', '2026-06-20 17:30:00+05:30', 'all', admin_id),
  ('Talent Night', null, 'Atrium', '2026-06-20 19:00:00+05:30', '2026-06-20 21:00:00+05:30', 'all', admin_id),
  ('Networking Dinner with PGP YL Co2027', null, 'Atrium', '2026-06-20 20:30:00+05:30', '2026-06-20 21:30:00+05:30', 'all', admin_id),

  -- ── Sun 21 June ──────────────────────────────────────────────────────────
  ('Rest Day', 'No scheduled sessions — recharge before Term 1.', null, '2026-06-21 09:00:00+05:30', '2026-06-21 18:00:00+05:30', 'all', admin_id);

  raise notice 'O-Week schedule seeded successfully.';
end $$;
