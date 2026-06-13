-- Co2028 PGP YL O-Week schedule import
-- Paste this whole file into Supabase SQL Editor and click Run.
-- It replaces O-Week events from 13 Jun 2026 to 21 Jun 2026, then creates
-- scheduled push reminders 15 minutes before each future session.

begin;

do $$
declare
  admin_id uuid;
begin
  select id
    into admin_id
  from public.profiles
  where role = 'admin'
  order by created_at
  limit 1;

  if admin_id is null then
    raise exception 'No admin profile found. Sign in once as an admin, then run this again.';
  end if;

  delete from public.notifications
  where event_id in (
    select id
    from public.events
    where starts_at >= timestamptz '2026-06-13 00:00:00+05:30'
      and starts_at <  timestamptz '2026-06-22 00:00:00+05:30'
  )
  or (
    title like 'Reminder:%'
    and scheduled_at >= timestamptz '2026-06-13 00:00:00+05:30'
    and scheduled_at <  timestamptz '2026-06-22 00:00:00+05:30'
  );

  delete from public.events
  where starts_at >= timestamptz '2026-06-13 00:00:00+05:30'
    and starts_at <  timestamptz '2026-06-22 00:00:00+05:30';

  with source(title, description, venue, starts_at, ends_at) as (
    values
      ('Arrival on Campus', 'Students arrive on campus and settle in for O-Week.', 'ISB Hyderabad Campus', timestamptz '2026-06-13 09:00:00+05:30', timestamptz '2026-06-13 11:00:00+05:30'),
      ('Registration', 'O-Week registration and check-in.', 'Registration Desk', timestamptz '2026-06-13 11:00:00+05:30', timestamptz '2026-06-13 12:30:00+05:30'),
      ('Break', 'Short break.', 'Campus', timestamptz '2026-06-13 12:30:00+05:30', timestamptz '2026-06-13 13:00:00+05:30'),
      ('Campus Tour', 'Campus tour led by Y1 volunteers.', 'ISB Hyderabad Campus', timestamptz '2026-06-13 13:00:00+05:30', timestamptz '2026-06-13 15:00:00+05:30'),
      ('Welcome Address - Dean', 'Welcome address by the Dean.', 'Auditorium', timestamptz '2026-06-13 15:00:00+05:30', timestamptz '2026-06-13 15:30:00+05:30'),
      ('Welcome Address - Associate Dean', 'Welcome address by the Associate Dean.', 'Auditorium', timestamptz '2026-06-13 15:30:00+05:30', timestamptz '2026-06-13 16:00:00+05:30'),
      ('Break', 'Short break.', 'Campus', timestamptz '2026-06-13 16:00:00+05:30', timestamptz '2026-06-13 16:30:00+05:30'),
      ('Welcome Dinner', 'Welcome dinner for Co2028.', 'Dining Hall', timestamptz '2026-06-13 19:30:00+05:30', timestamptz '2026-06-13 21:30:00+05:30'),

      ('Overview of O-Week', 'Orientation overview by Y2 students.', 'Auditorium', timestamptz '2026-06-14 09:00:00+05:30', timestamptz '2026-06-14 10:00:00+05:30'),
      ('Industry Panel Discussion', 'Panel discussion with industry speakers, moderated by faculty.', 'Auditorium', timestamptz '2026-06-14 10:00:00+05:30', timestamptz '2026-06-14 12:00:00+05:30'),
      ('Lunch Break', 'Lunch break.', 'Dining Hall', timestamptz '2026-06-14 12:00:00+05:30', timestamptz '2026-06-14 13:00:00+05:30'),
      ('Team Building - Squid Games and Dominoes', 'Team-building activities for the cohort.', 'Campus Activity Area', timestamptz '2026-06-14 13:00:00+05:30', timestamptz '2026-06-14 15:00:00+05:30'),
      ('Break', 'Short break.', 'Campus', timestamptz '2026-06-14 15:00:00+05:30', timestamptz '2026-06-14 15:30:00+05:30'),
      ('Team Building by Y2 Students / KYP', 'Team-building session and Know Your Peers activities led by Y2 students.', 'Campus Activity Area', timestamptz '2026-06-14 15:30:00+05:30', timestamptz '2026-06-14 17:30:00+05:30'),
      ('Break', 'Short break.', 'Campus', timestamptz '2026-06-14 17:30:00+05:30', timestamptz '2026-06-14 18:00:00+05:30'),

      ('AFA and ASA - Academic Affairs', 'Academic Affairs orientation session.', 'Auditorium', timestamptz '2026-06-15 09:00:00+05:30', timestamptz '2026-06-15 10:00:00+05:30'),
      ('HCC - Prof Sudhir Voleti', 'HCC session with Prof Sudhir Voleti.', 'Auditorium', timestamptz '2026-06-15 10:00:00+05:30', timestamptz '2026-06-15 11:30:00+05:30'),
      ('Lunch Break', 'Lunch break.', 'Dining Hall', timestamptz '2026-06-15 12:30:00+05:30', timestamptz '2026-06-15 13:30:00+05:30'),
      ('Acing the Case Study - Part CLTE', 'Case study preparation session by CLTE.', 'Auditorium', timestamptz '2026-06-15 13:30:00+05:30', timestamptz '2026-06-15 15:00:00+05:30'),
      ('Faculty Insights - Self-Leadership', 'Self-Leadership: How to lead yourself to academic and career success by Prof Debolina.', 'Auditorium', timestamptz '2026-06-15 15:00:00+05:30', timestamptz '2026-06-15 16:00:00+05:30'),
      ('AAA Presentation', 'AAA presentation session.', 'Auditorium', timestamptz '2026-06-15 16:00:00+05:30', timestamptz '2026-06-15 17:00:00+05:30'),
      ('Break', 'Short break.', 'Campus', timestamptz '2026-06-15 17:00:00+05:30', timestamptz '2026-06-15 17:30:00+05:30'),
      ('Maths Tutorials (Tentative)', 'Tentative maths tutorials.', 'Classrooms', timestamptz '2026-06-15 17:30:00+05:30', timestamptz '2026-06-15 19:00:00+05:30'),

      ('Operations', 'Operations orientation session.', 'Auditorium', timestamptz '2026-06-16 09:00:00+05:30', timestamptz '2026-06-16 10:00:00+05:30'),
      ('Brand and Social Media Guidelines and LAB (Tentative)', 'Brand, social media guidelines, and LAB orientation.', 'Auditorium', timestamptz '2026-06-16 10:00:00+05:30', timestamptz '2026-06-16 11:30:00+05:30'),
      ('Break', 'Short break.', 'Campus', timestamptz '2026-06-16 11:30:00+05:30', timestamptz '2026-06-16 12:00:00+05:30'),
      ('Faculty Insights - Prof Madhu V', 'Faculty insights session by Prof Madhu V.', 'Auditorium', timestamptz '2026-06-16 12:00:00+05:30', timestamptz '2026-06-16 13:00:00+05:30'),
      ('Lunch Break', 'Lunch break.', 'Dining Hall', timestamptz '2026-06-16 13:00:00+05:30', timestamptz '2026-06-16 14:00:00+05:30'),
      ('Maths Tutorials (Tentative)', 'Tentative maths tutorials.', 'Classrooms', timestamptz '2026-06-16 14:00:00+05:30', timestamptz '2026-06-16 16:00:00+05:30'),
      ('Team Building by Y2 Students / KYP', 'Team-building session and Know Your Peers activities led by Y2 students.', 'Campus Activity Area', timestamptz '2026-06-16 16:00:00+05:30', timestamptz '2026-06-16 18:00:00+05:30'),

      ('Stats Tutorials (Tentative)', 'Tentative statistics tutorials.', 'Classrooms', timestamptz '2026-06-17 09:00:00+05:30', timestamptz '2026-06-17 11:00:00+05:30'),
      ('Break', 'Short break.', 'Campus', timestamptz '2026-06-17 11:00:00+05:30', timestamptz '2026-06-17 11:30:00+05:30'),
      ('Faculty Insights - Effective Class Participation', 'Effective class participation session by Prof Deepak Jena.', 'Auditorium', timestamptz '2026-06-17 11:30:00+05:30', timestamptz '2026-06-17 12:30:00+05:30'),
      ('Break', 'Short break.', 'Campus', timestamptz '2026-06-17 12:30:00+05:30', timestamptz '2026-06-17 13:00:00+05:30'),
      ('Networking', 'Networking session.', 'Campus', timestamptz '2026-06-17 17:30:00+05:30', timestamptz '2026-06-17 19:00:00+05:30'),

      ('Business Simulation - Team Activators', 'Business simulation session by Team Activators.', 'Khemka Auditorium', timestamptz '2026-06-18 09:00:00+05:30', timestamptz '2026-06-18 12:30:00+05:30'),
      ('Lunch Break', 'Lunch break.', 'Dining Hall', timestamptz '2026-06-18 12:30:00+05:30', timestamptz '2026-06-18 13:30:00+05:30'),
      ('Presentation by CAS', 'CAS presentation.', 'Auditorium', timestamptz '2026-06-18 13:30:00+05:30', timestamptz '2026-06-18 14:30:00+05:30'),
      ('Break', 'Short break.', 'Campus', timestamptz '2026-06-18 14:30:00+05:30', timestamptz '2026-06-18 15:00:00+05:30'),
      ('ASA Student Affairs', 'ASA Student Affairs session.', 'Auditorium', timestamptz '2026-06-18 15:00:00+05:30', timestamptz '2026-06-18 16:00:00+05:30'),
      ('GSB Panel Discussion', 'GSB panel discussion.', 'Auditorium', timestamptz '2026-06-18 16:00:00+05:30', timestamptz '2026-06-18 17:00:00+05:30'),
      ('Social Clubs Session', 'Social clubs introduction session.', 'Auditorium', timestamptz '2026-06-18 17:00:00+05:30', timestamptz '2026-06-18 18:00:00+05:30'),
      ('Canvas Painting - Time Capsule', 'Canvas painting activity for the time capsule.', 'Campus Activity Area', timestamptz '2026-06-18 18:00:00+05:30', timestamptz '2026-06-18 19:00:00+05:30'),

      ('Professional Clubs Session', 'Professional clubs introduction session.', 'Auditorium', timestamptz '2026-06-19 09:00:00+05:30', timestamptz '2026-06-19 10:30:00+05:30'),
      ('Faculty Insights - Prof Prasanna', 'Faculty insights session by Prof Prasanna.', 'Auditorium', timestamptz '2026-06-19 10:30:00+05:30', timestamptz '2026-06-19 11:30:00+05:30'),
      ('CASHD Session', 'CASHD session.', 'Auditorium', timestamptz '2026-06-19 11:30:00+05:30', timestamptz '2026-06-19 12:30:00+05:30'),
      ('Lunch Break', 'Lunch break.', 'Dining Hall', timestamptz '2026-06-19 12:30:00+05:30', timestamptz '2026-06-19 13:30:00+05:30'),
      ('Wellbeing Counselling', 'Wellbeing counselling session with Swati, Zenobia, Smita and Pause SIG.', 'Auditorium', timestamptz '2026-06-19 13:30:00+05:30', timestamptz '2026-06-19 15:00:00+05:30'),
      ('Break', 'Short break.', 'Campus', timestamptz '2026-06-19 15:00:00+05:30', timestamptz '2026-06-19 15:30:00+05:30'),
      ('Ramoji Event', 'Ramoji event.', 'Ramoji Film City', timestamptz '2026-06-19 16:00:00+05:30', timestamptz '2026-06-19 22:00:00+05:30'),
      ('Pause SIG', 'Pause SIG activity.', 'Campus', timestamptz '2026-06-19 18:00:00+05:30', timestamptz '2026-06-19 19:00:00+05:30'),

      ('Alum Session - Impact Stories', 'Alumni panel discussion on impact stories.', 'Auditorium', timestamptz '2026-06-20 10:00:00+05:30', timestamptz '2026-06-20 12:00:00+05:30'),
      ('Lunch Break', 'Lunch break.', 'Dining Hall', timestamptz '2026-06-20 12:00:00+05:30', timestamptz '2026-06-20 13:00:00+05:30'),
      ('Alum Session - The Power of Setbacks', 'Alumni panel discussion on the power of setbacks.', 'Auditorium', timestamptz '2026-06-20 13:00:00+05:30', timestamptz '2026-06-20 15:00:00+05:30'),
      ('Break - Talent Night Prep', 'Break and talent night preparation.', 'Campus', timestamptz '2026-06-20 15:00:00+05:30', timestamptz '2026-06-20 17:00:00+05:30'),
      ('Talent Night', 'Talent Night for Co2028.', 'Auditorium', timestamptz '2026-06-20 17:00:00+05:30', timestamptz '2026-06-20 19:30:00+05:30'),
      ('Networking Dinner with PGP YL Co2027', 'Networking dinner with PGP YL Co2027.', 'Dining Hall', timestamptz '2026-06-20 19:30:00+05:30', timestamptz '2026-06-20 21:30:00+05:30'),

      ('Rest Day', 'No formal O-Week sessions scheduled.', 'Campus', timestamptz '2026-06-21 09:00:00+05:30', timestamptz '2026-06-21 18:00:00+05:30')
  ),
  inserted as (
    insert into public.events (
      title,
      description,
      venue,
      starts_at,
      ends_at,
      visibility,
      created_by
    )
    select
      title,
      description,
      venue,
      starts_at,
      ends_at,
      'all'::public.visibility_scope,
      admin_id
    from source
    returning id, title, venue, starts_at
  )
  insert into public.notifications (
    title,
    body,
    deep_link,
    visibility,
    status,
    event_id,
    scheduled_at,
    created_by
  )
  select
    'Reminder: ' || title,
    case
      when venue is null or venue = '' then title || ' starts in 15 minutes.'
      else title || ' starts in 15 minutes at ' || venue || '.'
    end,
    '/events/' || id,
    'all'::public.visibility_scope,
    'scheduled'::public.notification_status,
    id,
    starts_at - interval '15 minutes',
    admin_id
  from inserted
  where starts_at - interval '15 minutes' > now();
end $$;

commit;

select
  count(*) as approved_student_count
from public.allowed_students;

select
  count(*) as imported_event_count
from public.events
where starts_at >= timestamptz '2026-06-13 00:00:00+05:30'
  and starts_at <  timestamptz '2026-06-22 00:00:00+05:30';

select
  count(*) as scheduled_reminder_count
from public.notifications
where status = 'scheduled'
  and scheduled_at >= timestamptz '2026-06-13 00:00:00+05:30'
  and scheduled_at <  timestamptz '2026-06-22 00:00:00+05:30';
