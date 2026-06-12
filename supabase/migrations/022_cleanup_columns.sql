-- ─── Cleanup: revert delegated calendar sync, drop unused columns ───────────
-- Delegated flow abandoned in favour of ICS invites via Mail.Send.

-- 1. Drop columns no longer needed
ALTER TABLE public.profiles DROP COLUMN IF EXISTS refresh_token;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS expo_push_token;

-- 2. Add sequence tracking for ICS calendar invites (METHOD:REQUEST uses SEQUENCE)
ALTER TABLE public.calendar_sync_log
  ADD COLUMN IF NOT EXISTS sequence integer NOT NULL DEFAULT 0;

-- 3. Update safety trigger error message (expo_push_token → fcm_token)
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
    RAISE EXCEPTION 'Students can only update phone_number, about_me, fcm_token, and avatar_url';
  END IF;
  RETURN NEW;
END;
$$;
