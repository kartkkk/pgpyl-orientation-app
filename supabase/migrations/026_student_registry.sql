-- ============================================================================
-- Student Registry — Pre-registration whitelist for PGP Class of 2027 (Hyd)
-- ============================================================================
-- This table stores the official student list. Only students whose email
-- appears here will have a profile auto-created on Microsoft OAuth sign-in.
-- Email (lowercased) is the primary key and lookup key.
--
-- Seed data is applied directly to the database (not committed to git)
-- to keep student PII out of version control.

CREATE TABLE public.student_registry (
  email        text        PRIMARY KEY,
  student_id   text        NOT NULL UNIQUE,
  full_name    text        NOT NULL,
  gender       text,
  mobile       text
);

-- RLS
ALTER TABLE public.student_registry ENABLE ROW LEVEL SECURITY;

-- Admins can read/write everything
CREATE POLICY "student_registry: admin full access"
  ON public.student_registry
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Students can read their own row
CREATE POLICY "student_registry: read own"
  ON public.student_registry
  FOR SELECT
  USING (email = lower(coalesce(auth.email(), '')));

-- Service role (triggers) bypass RLS, so handle_new_user() can read freely.