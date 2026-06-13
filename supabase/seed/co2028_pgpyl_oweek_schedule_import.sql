-- Co2028 PGP YL O-Week schedule import
-- Paste this whole file into Supabase SQL Editor and click Run.
-- This version follows the PDF half-hour grid and does NOT import grey
-- "Break" / "Lunch Break" / "Do not schedule" blocks as events.

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

  with source(title, description, venue, starts_at, ends_at, should_remind) as (
    values
      ('Arrival on campus', 'Arrival on campus as per the approved O-Week schedule.', 'ISB Hyderabad Campus', timestamptz '2026-06-13 09:00:00+05:30', timestamptz '2026-06-13 13:30:00+05:30', true),
      ('Registration', 'Registration for Co2028 PGP YL O-Week.', 'Registration Desk', timestamptz '2026-06-13 13:30:00+05:30', timestamptz '2026-06-13 16:00:00+05:30', true),
      ('Campus Tour (Y1 Volunteers)', 'Campus tour led by Y1 volunteers.', 'ISB Hyderabad Campus', timestamptz '2026-06-13 16:30:00+05:30', timestamptz '2026-06-13 17:30:00+05:30', true),
      ('Welcome Address - Dean (Confirmed)', 'Welcome address by the Dean.', 'Auditorium', timestamptz '2026-06-13 18:00:00+05:30', timestamptz '2026-06-13 18:30:00+05:30', true),
      ('Welcome Address - Associate Dean (Confirmed)', 'Welcome address by the Associate Dean.', 'Auditorium', timestamptz '2026-06-13 18:30:00+05:30', timestamptz '2026-06-13 19:00:00+05:30', true),
      ('Welcome Dinner', 'Welcome dinner for Co2028.', 'Dining Hall', timestamptz '2026-06-13 19:30:00+05:30', timestamptz '2026-06-13 21:30:00+05:30', true),

      ('Overview of Oweek - Y2', 'O-Week overview by Y2 students.', 'Auditorium', timestamptz '2026-06-14 10:00:00+05:30', timestamptz '2026-06-14 10:30:00+05:30', true),
      ('Panel Discussion - Industry Speakers moderated by Faculty', 'Industry speaker panel discussion moderated by faculty.', 'Auditorium', timestamptz '2026-06-14 10:30:00+05:30', timestamptz '2026-06-14 12:30:00+05:30', true),
      ('Team Building (Squid Games and Dominoes)', 'O-Week team-building activity.', 'Campus Activity Area', timestamptz '2026-06-14 13:30:00+05:30', timestamptz '2026-06-14 19:30:00+05:30', true),

      ('AFA & ASA (Academic Affairs)', 'Academic Affairs session by AFA and ASA.', 'Auditorium', timestamptz '2026-06-15 11:00:00+05:30', timestamptz '2026-06-15 12:00:00+05:30', true),
      ('HCC - Prof Sudhir Voleti (Confirmed)', 'HCC session by Prof Sudhir Voleti.', 'Auditorium', timestamptz '2026-06-15 12:00:00+05:30', timestamptz '2026-06-15 13:00:00+05:30', true),
      ('Acing the Case Study - Part CLTE (Confirmed)', 'Acing the case study session by CLTE.', 'Auditorium', timestamptz '2026-06-15 14:00:00+05:30', timestamptz '2026-06-15 15:00:00+05:30', true),
      ('Faculty Insights - Self-Leadership (Confirmed)', 'Self-Leadership: How to lead yourself to academic and career success - Prof Debolina.', 'Auditorium', timestamptz '2026-06-15 15:00:00+05:30', timestamptz '2026-06-15 16:00:00+05:30', true),
      ('AAA Presentation - Section A', 'AAA presentation for Section A.', 'Auditorium', timestamptz '2026-06-15 16:30:00+05:30', timestamptz '2026-06-15 17:00:00+05:30', true),
      ('AAA Presentation - Section B', 'AAA presentation for Section B.', 'Auditorium', timestamptz '2026-06-15 17:30:00+05:30', timestamptz '2026-06-15 18:00:00+05:30', true),
      ('Maths Tutorials (Tentative) - Section B', 'Tentative maths tutorial for Section B.', 'Classrooms', timestamptz '2026-06-15 18:00:00+05:30', timestamptz '2026-06-15 19:30:00+05:30', true),

      ('Operations, Brand & Social Media Guidelines & LAB (Tentative)', 'Operations, brand, social media guidelines and LAB session.', 'Auditorium', timestamptz '2026-06-16 09:30:00+05:30', timestamptz '2026-06-16 11:30:00+05:30', true),
      ('Faculty Insights Session - Prof Madhu V (Confirmed)', 'Faculty insights session by Prof Madhu V.', 'Auditorium', timestamptz '2026-06-16 12:00:00+05:30', timestamptz '2026-06-16 13:30:00+05:30', true),
      ('Maths Tutorials (Tentative) - Section A', 'Tentative maths tutorial for Section A.', 'Classrooms', timestamptz '2026-06-16 14:30:00+05:30', timestamptz '2026-06-16 16:00:00+05:30', true),
      ('Team Building by Y2 Students / KYP', 'Team-building and KYP session led by Y2 students.', 'Campus Activity Area', timestamptz '2026-06-16 16:30:00+05:30', timestamptz '2026-06-16 17:30:00+05:30', true),
      ('Session on D&I', 'Diversity and inclusion session.', 'Auditorium', timestamptz '2026-06-16 17:30:00+05:30', timestamptz '2026-06-16 18:30:00+05:30', true),
      ('Team Building by Y2 Students / KYP', 'Team-building and KYP session led by Y2 students.', 'Campus Activity Area', timestamptz '2026-06-16 18:30:00+05:30', timestamptz '2026-06-16 19:30:00+05:30', true),

      ('Stats Tutorials (Tentative) - Section A', 'Tentative statistics tutorial for Section A.', 'Classrooms', timestamptz '2026-06-17 10:00:00+05:30', timestamptz '2026-06-17 11:30:00+05:30', true),
      ('Faculty Insights - Effective Class Participation (Confirmed)', 'Effective class participation session by Prof Deepak Jena.', 'Auditorium', timestamptz '2026-06-17 14:00:00+05:30', timestamptz '2026-06-17 16:00:00+05:30', true),
      ('Stats Tutorials (Tentative) - Section B', 'Tentative statistics tutorial for Section B.', 'Classrooms', timestamptz '2026-06-17 16:30:00+05:30', timestamptz '2026-06-17 18:00:00+05:30', true),
      ('Networking', 'Networking session.', 'Campus', timestamptz '2026-06-17 18:00:00+05:30', timestamptz '2026-06-17 19:30:00+05:30', true),

      ('Business Simulation - Team Activators (Confirmed)', 'Business simulation by Team Activators at Khemka.', 'Khemka Auditorium', timestamptz '2026-06-18 10:00:00+05:30', timestamptz '2026-06-18 13:00:00+05:30', true),
      ('Presentation by CAS', 'CAS presentation.', 'Auditorium', timestamptz '2026-06-18 14:00:00+05:30', timestamptz '2026-06-18 15:30:00+05:30', true),
      ('ASA Student Affairs', 'ASA Student Affairs session.', 'Auditorium', timestamptz '2026-06-18 16:00:00+05:30', timestamptz '2026-06-18 17:00:00+05:30', true),
      ('GSB Panel Discussion', 'GSB panel discussion.', 'Auditorium', timestamptz '2026-06-18 17:30:00+05:30', timestamptz '2026-06-18 18:30:00+05:30', true),
      ('Social Clubs Session', 'Social clubs session.', 'Auditorium', timestamptz '2026-06-18 18:30:00+05:30', timestamptz '2026-06-18 19:30:00+05:30', true),
      ('Canvas Painting (time capsule)', 'Canvas painting time capsule activity.', 'Campus Activity Area', timestamptz '2026-06-18 19:30:00+05:30', timestamptz '2026-06-18 21:30:00+05:30', true),

      ('Professional Clubs session', 'Professional clubs session.', 'Auditorium', timestamptz '2026-06-19 10:00:00+05:30', timestamptz '2026-06-19 11:00:00+05:30', true),
      ('Faculty Insights Session - Prof Prasanna (Confirmed)', 'Faculty insights session by Prof Prasanna.', 'Auditorium', timestamptz '2026-06-19 11:00:00+05:30', timestamptz '2026-06-19 12:00:00+05:30', true),
      ('CASHD Session', 'CASHD session.', 'Auditorium', timestamptz '2026-06-19 12:30:00+05:30', timestamptz '2026-06-19 13:30:00+05:30', true),
      ('Wellbeing Counselling - Swati, Zenobia, Smita & Pause (SIG) (Confirmed)', 'Wellbeing counselling session with Swati, Zenobia, Smita and Pause SIG.', 'Auditorium', timestamptz '2026-06-19 15:00:00+05:30', timestamptz '2026-06-19 16:30:00+05:30', true),
      ('Ramoji Event', 'Ramoji event.', 'Ramoji Film City', timestamptz '2026-06-19 17:00:00+05:30', timestamptz '2026-06-19 19:30:00+05:30', true),
      ('Pause SIG', 'Pause SIG activity.', 'Campus', timestamptz '2026-06-19 19:30:00+05:30', timestamptz '2026-06-19 21:30:00+05:30', true),

      ('Alum Sessions - Panel Discussion on Impact Stories', 'Alumni panel discussion on impact stories.', 'Auditorium', timestamptz '2026-06-20 10:00:00+05:30', timestamptz '2026-06-20 12:30:00+05:30', true),
      ('Alum Sessions - Panel Discussion on The Power of Setbacks', 'Alumni panel discussion on the power of setbacks.', 'Auditorium', timestamptz '2026-06-20 13:30:00+05:30', timestamptz '2026-06-20 15:30:00+05:30', true),
      ('Break - Talent Night Prep', 'Talent Night preparation block.', 'Campus', timestamptz '2026-06-20 15:30:00+05:30', timestamptz '2026-06-20 17:30:00+05:30', false),
      ('Talent Night', 'Talent Night for Co2028.', 'Auditorium', timestamptz '2026-06-20 17:30:00+05:30', timestamptz '2026-06-20 19:30:00+05:30', true),
      ('Networking dinner with PGP YL Co2027', 'Networking dinner with PGP YL Co2027.', 'Dining Hall', timestamptz '2026-06-20 19:30:00+05:30', timestamptz '2026-06-20 21:30:00+05:30', true),

      ('Rest Day', 'No formal O-Week sessions scheduled.', 'Campus', timestamptz '2026-06-21 09:00:00+05:30', timestamptz '2026-06-21 21:30:00+05:30', false)
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
  ),
  reminder_source as (
    select inserted.*
    from inserted
    join source using (title, starts_at)
    where source.should_remind
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
  from reminder_source
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
