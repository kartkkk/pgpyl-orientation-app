-- ============================================================================
-- Inside The Atrium — Attendance Audit Log
-- ============================================================================

CREATE TABLE public.attendance_audit_log (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id    UUID NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
  event_id      UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  action        TEXT NOT NULL CHECK (action IN ('session_opened', 'session_closed')),
  performed_by  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  detail        TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_attendance_audit_session ON public.attendance_audit_log(session_id);
CREATE INDEX idx_attendance_audit_created ON public.attendance_audit_log(created_at DESC);

ALTER TABLE public.attendance_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attendance_audit_log: admin read"
  ON public.attendance_audit_log FOR SELECT
  USING (public.is_admin());

CREATE POLICY "attendance_audit_log: admin insert"
  ON public.attendance_audit_log FOR INSERT
  WITH CHECK (public.is_admin());
