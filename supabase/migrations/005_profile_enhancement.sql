-- ============================================================================
-- Inside The Atrium — Profile Enhancement
-- Adds phone_number and about_me to profiles, with a safety trigger
-- ============================================================================

-- ─── New Columns ───────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN phone_number text,
  ADD COLUMN about_me     text;

-- ─── Safety Trigger: restrict student self-updates ─────────────────────────
-- Students may only change: phone_number, about_me, expo_push_token, avatar_url.
-- Admins can change anything (bypass via is_admin()).

CREATE OR REPLACE FUNCTION public.restrict_student_profile_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_admin() AND (
    NEW.role         IS DISTINCT FROM OLD.role         OR
    NEW.section_id   IS DISTINCT FROM OLD.section_id   OR
    NEW.roll_number  IS DISTINCT FROM OLD.roll_number  OR
    NEW.full_name    IS DISTINCT FROM OLD.full_name    OR
    NEW.email        IS DISTINCT FROM OLD.email        OR
    NEW.is_active    IS DISTINCT FROM OLD.is_active    OR
    NEW.promoted_by  IS DISTINCT FROM OLD.promoted_by  OR
    NEW.promoted_at  IS DISTINCT FROM OLD.promoted_at
  ) THEN
    RAISE EXCEPTION 'Students can only update phone_number, about_me, expo_push_token, and avatar_url';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER restrict_student_profile_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.restrict_student_profile_update();
