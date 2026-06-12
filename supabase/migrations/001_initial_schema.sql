-- ============================================================================
-- Inside The Atrium — Initial Schema
-- ============================================================================

-- Extensions
create extension if not exists "pgcrypto";
create extension if not exists "moddatetime";

-- ─── Custom Types ───────────────────────────────────────────────────────────

create type public.user_role as enum ('admin', 'student');
create type public.visibility_scope as enum ('all', 'section', 'individual');
create type public.notification_status as enum ('draft', 'scheduled', 'sending', 'sent', 'failed');

-- ─── Sections ───────────────────────────────────────────────────────────────

create table public.sections (
  id         uuid        primary key default gen_random_uuid(),
  code       char(1)     not null unique check (code in ('A','B','C','D','E','F')),
  name       text        not null unique,
  created_at timestamptz not null default now()
);

-- ─── Profiles (extends auth.users) ──────────────────────────────────────────

create table public.profiles (
  id              uuid         primary key references auth.users(id) on delete cascade,
  full_name       text         not null,
  email           text         not null unique,
  role            user_role    not null default 'student',
  section_id      uuid         references public.sections(id) on delete set null,
  roll_number     text         unique,
  avatar_url      text,
  expo_push_token text,
  is_active       boolean      not null default true,
  promoted_by     uuid         references public.profiles(id) on delete set null,
  promoted_at     timestamptz,
  created_at      timestamptz  not null default now(),
  updated_at      timestamptz  not null default now()
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure moddatetime(updated_at);

create index idx_profiles_role       on public.profiles(role);
create index idx_profiles_section_id on public.profiles(section_id);
create index idx_profiles_email      on public.profiles(email);

-- ─── Events ─────────────────────────────────────────────────────────────────

create table public.events (
  id                  uuid             primary key default gen_random_uuid(),
  title               text             not null,
  description         text,
  venue               text,
  starts_at           timestamptz      not null,
  ends_at             timestamptz,
  visibility          visibility_scope not null default 'all',
  outlook_event_id    text,
  outlook_calendar_id text,
  ical_uid            text unique,
  is_cancelled        boolean          not null default false,
  created_by          uuid             not null references public.profiles(id) on delete restrict,
  created_at          timestamptz      not null default now(),
  updated_at          timestamptz      not null default now(),

  constraint ends_after_starts check (ends_at is null or ends_at > starts_at)
);

create trigger events_updated_at
  before update on public.events
  for each row execute procedure moddatetime(updated_at);

create index idx_events_starts_at  on public.events(starts_at);
create index idx_events_visibility on public.events(visibility);
create index idx_events_created_by on public.events(created_by);

-- ─── Event Assignments ──────────────────────────────────────────────────────

create table public.event_assignments (
  id         uuid        primary key default gen_random_uuid(),
  event_id   uuid        not null references public.events(id) on delete cascade,
  section_id uuid        references public.sections(id) on delete cascade,
  profile_id uuid        references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),

  constraint exactly_one_target check (
    (section_id is not null and profile_id is null) or
    (section_id is null     and profile_id is not null)
  ),
  unique (event_id, section_id),
  unique (event_id, profile_id)
);

create index idx_event_assignments_event_id   on public.event_assignments(event_id);
create index idx_event_assignments_section_id on public.event_assignments(section_id);
create index idx_event_assignments_profile_id on public.event_assignments(profile_id);

-- ─── Attendance Sessions ────────────────────────────────────────────────────

create table public.attendance_sessions (
  id        uuid        primary key default gen_random_uuid(),
  event_id  uuid        not null references public.events(id) on delete cascade,
  opened_by uuid        not null references public.profiles(id) on delete restrict,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  is_open   boolean     not null default true,

  constraint closed_after_opened
    check (closed_at is null or closed_at > opened_at)
);

create index idx_attendance_sessions_event_id on public.attendance_sessions(event_id);
create index idx_attendance_sessions_is_open  on public.attendance_sessions(is_open) where is_open = true;

-- ─── QR Tokens (rotates every 120s) ────────────────────────────────────────

create table public.qr_tokens (
  id          uuid        primary key default gen_random_uuid(),
  session_id  uuid        not null references public.attendance_sessions(id) on delete cascade,
  token       text        not null unique default encode(extensions.gen_random_bytes(32), 'hex'),
  valid_from  timestamptz not null default now(),
  valid_until timestamptz not null default (now() + interval '30 seconds'),
  created_at  timestamptz not null default now(),

  constraint valid_window check (valid_until > valid_from)
);

create index idx_qr_tokens_session_id  on public.qr_tokens(session_id);
create index idx_qr_tokens_valid_until on public.qr_tokens(valid_until);

-- ─── Attendance Records ─────────────────────────────────────────────────────

create table public.attendance_records (
  id            uuid        primary key default gen_random_uuid(),
  session_id    uuid        not null references public.attendance_sessions(id) on delete cascade,
  profile_id    uuid        not null references public.profiles(id) on delete cascade,
  qr_token_id   uuid        not null references public.qr_tokens(id) on delete restrict,
  scanned_at    timestamptz not null default now(),
  is_manual     boolean     not null default false,
  overridden_by uuid        references public.profiles(id) on delete set null,

  unique (session_id, profile_id)
);

create index idx_attendance_records_session_id on public.attendance_records(session_id);
create index idx_attendance_records_profile_id on public.attendance_records(profile_id);

-- ─── Documents ──────────────────────────────────────────────────────────────

create table public.documents (
  id          uuid             primary key default gen_random_uuid(),
  title       text             not null,
  url         text             not null,
  description text,
  visibility  visibility_scope not null default 'all',
  created_by  uuid             not null references public.profiles(id) on delete restrict,
  created_at  timestamptz      not null default now(),
  updated_at  timestamptz      not null default now()
);

create trigger documents_updated_at
  before update on public.documents
  for each row execute procedure moddatetime(updated_at);

create index idx_documents_visibility on public.documents(visibility);
create index idx_documents_created_by on public.documents(created_by);

-- ─── Document Assignments ───────────────────────────────────────────────────

create table public.document_assignments (
  id          uuid        primary key default gen_random_uuid(),
  document_id uuid        not null references public.documents(id) on delete cascade,
  section_id  uuid        references public.sections(id) on delete cascade,
  profile_id  uuid        references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),

  constraint exactly_one_target check (
    (section_id is not null and profile_id is null) or
    (section_id is null     and profile_id is not null)
  ),
  unique (document_id, section_id),
  unique (document_id, profile_id)
);

create index idx_document_assignments_document_id on public.document_assignments(document_id);

-- ─── Notifications ──────────────────────────────────────────────────────────

create table public.notifications (
  id           uuid                primary key default gen_random_uuid(),
  title        text                not null,
  body         text                not null,
  deep_link    text,
  visibility   visibility_scope    not null default 'all',
  status       notification_status not null default 'draft',
  event_id     uuid                references public.events(id) on delete set null,
  scheduled_at timestamptz,
  sent_at      timestamptz,
  created_by   uuid                not null references public.profiles(id) on delete restrict,
  created_at   timestamptz         not null default now(),
  updated_at   timestamptz         not null default now()
);

create trigger notifications_updated_at
  before update on public.notifications
  for each row execute procedure moddatetime(updated_at);

create index idx_notifications_status       on public.notifications(status);
create index idx_notifications_scheduled_at on public.notifications(scheduled_at) where status = 'scheduled';
create index idx_notifications_event_id     on public.notifications(event_id);

-- ─── Notification Assignments ───────────────────────────────────────────────

create table public.notification_assignments (
  id              uuid        primary key default gen_random_uuid(),
  notification_id uuid        not null references public.notifications(id) on delete cascade,
  section_id      uuid        references public.sections(id) on delete cascade,
  profile_id      uuid        references public.profiles(id) on delete cascade,
  created_at      timestamptz not null default now(),

  constraint exactly_one_target check (
    (section_id is not null and profile_id is null) or
    (section_id is null     and profile_id is not null)
  ),
  unique (notification_id, section_id),
  unique (notification_id, profile_id)
);

-- ─── Notification Deliveries (per-user tracking) ────────────────────────────

create table public.notification_deliveries (
  id              uuid        primary key default gen_random_uuid(),
  notification_id uuid        not null references public.notifications(id) on delete cascade,
  profile_id      uuid        not null references public.profiles(id) on delete cascade,
  push_token      text        not null,
  delivered_at    timestamptz,
  read_at         timestamptz,
  error_message   text,
  created_at      timestamptz not null default now(),

  unique (notification_id, profile_id)
);

create index idx_notification_deliveries_notification_id on public.notification_deliveries(notification_id);
create index idx_notification_deliveries_profile_id      on public.notification_deliveries(profile_id);

-- ─── Auto-create profile on auth signup ─────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
