-- ============================================================================
-- Inside The Atrium — Section Wars Leaderboard, Student Bodies, Important Contacts
-- ============================================================================

-- ─── Section Wars Leaderboard ────────────────────────────────────────────────

CREATE TABLE public.section_leaderboard (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id  UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  score       INTEGER NOT NULL DEFAULT 0,
  updated_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (section_id)
);

-- Seed one row per section so admins only need to UPDATE
INSERT INTO public.section_leaderboard (section_id)
SELECT id FROM public.sections;

-- ─── Student Bodies ──────────────────────────────────────────────────────────

CREATE TYPE public.student_body_type AS ENUM ('gsb', 'club', 'sig');

CREATE TABLE public.student_bodies (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type        public.student_body_type NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.student_body_members (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_body_id  UUID NOT NULL REFERENCES public.student_bodies(id) ON DELETE CASCADE,
  member_name      TEXT NOT NULL,
  role             TEXT NOT NULL,          -- e.g. 'Director', 'President', 'Vice President', 'Core Team', 'Member'
  email            TEXT,
  display_order    INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Important Contacts ──────────────────────────────────────────────────────

CREATE TABLE public.important_contacts (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  body_name     TEXT NOT NULL,             -- e.g. 'Wellness Center'
  poc_name      TEXT NOT NULL,             -- Point of Contact name
  phone_number  TEXT,
  email         TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
