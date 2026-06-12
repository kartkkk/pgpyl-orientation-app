-- ============================================================================
-- Inside The Atrium — RLS Policies for Leaderboard, Student Bodies, Important Contacts
-- ============================================================================

ALTER TABLE public.section_leaderboard    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_bodies         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_body_members   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.important_contacts     ENABLE ROW LEVEL SECURITY;

-- ─── section_leaderboard ─────────────────────────────────────────────────────

-- Everyone can read
CREATE POLICY "section_leaderboard: anyone reads"
  ON public.section_leaderboard FOR SELECT
  USING (true);

-- Only admins can update scores
CREATE POLICY "section_leaderboard: admin update"
  ON public.section_leaderboard FOR UPDATE
  USING (public.is_admin());

-- Admin full access (for insert/delete if needed)
CREATE POLICY "section_leaderboard: admin all"
  ON public.section_leaderboard FOR ALL
  USING (public.is_admin());

-- ─── student_bodies ──────────────────────────────────────────────────────────

-- Everyone can read
CREATE POLICY "student_bodies: anyone reads"
  ON public.student_bodies FOR SELECT
  USING (true);

-- Admin: full access
CREATE POLICY "student_bodies: admin all"
  ON public.student_bodies FOR ALL
  USING (public.is_admin());

-- ─── student_body_members ────────────────────────────────────────────────────

-- Everyone can read
CREATE POLICY "student_body_members: anyone reads"
  ON public.student_body_members FOR SELECT
  USING (true);

-- Admin: full access
CREATE POLICY "student_body_members: admin all"
  ON public.student_body_members FOR ALL
  USING (public.is_admin());

-- ─── important_contacts ─────────────────────────────────────────────────────

-- Everyone can read
CREATE POLICY "important_contacts: anyone reads"
  ON public.important_contacts FOR SELECT
  USING (true);

-- Admin: full access
CREATE POLICY "important_contacts: admin all"
  ON public.important_contacts FOR ALL
  USING (public.is_admin());
