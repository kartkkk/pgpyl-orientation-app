-- ============================================================================
-- Inside The Atrium — Score Audit Log
-- Tracks every leaderboard score change with who made it and why.
-- ============================================================================

CREATE TABLE public.score_audit_log (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id  UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  changed_by  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  old_score   INTEGER NOT NULL,
  new_score   INTEGER NOT NULL,
  delta       INTEGER NOT NULL,         -- positive = added, negative = removed
  reason      TEXT,                     -- optional note
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_score_audit_log_section ON public.score_audit_log(section_id);
CREATE INDEX idx_score_audit_log_changed_by ON public.score_audit_log(changed_by);
CREATE INDEX idx_score_audit_log_created_at ON public.score_audit_log(created_at DESC);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.score_audit_log ENABLE ROW LEVEL SECURITY;

-- Admins can read all audit entries
CREATE POLICY "score_audit_log: admin reads"
  ON public.score_audit_log FOR SELECT
  USING (public.is_admin());

-- Admins can insert
CREATE POLICY "score_audit_log: admin insert"
  ON public.score_audit_log FOR INSERT
  WITH CHECK (public.is_admin());
