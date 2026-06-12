-- ============================================================================
-- Sorting Hat Ceremony — registry-driven section reveal
-- ============================================================================
-- Adds section_code to student_registry (admin pre-fills before ceremony).
-- Removes section_id from the student profile update restriction so the
-- completion RPC can set it. Creates the complete_sorting_hat() RPC.

-- 1. Add section_code to student_registry
ALTER TABLE public.student_registry
  ADD COLUMN section_code char(1)
  CHECK (section_code IS NULL OR section_code IN ('A','B','C','D','E','F'));

-- 2. Remove section_id from restricted columns
CREATE OR REPLACE FUNCTION public.restrict_student_profile_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_admin() AND (
    NEW.role         IS DISTINCT FROM OLD.role         OR
    NEW.roll_number  IS DISTINCT FROM OLD.roll_number  OR
    NEW.full_name    IS DISTINCT FROM OLD.full_name    OR
    NEW.email        IS DISTINCT FROM OLD.email        OR
    NEW.is_active    IS DISTINCT FROM OLD.is_active    OR
    NEW.promoted_by  IS DISTINCT FROM OLD.promoted_by  OR
    NEW.promoted_at  IS DISTINCT FROM OLD.promoted_at
  ) THEN
    RAISE EXCEPTION 'Students can only update phone_number, about_me, fcm_token, avatar_url, and section_id (via ceremony)';
  END IF;
  RETURN NEW;
END;
$$;

-- 3. RPC: complete the sorting hat ceremony
--    Sets profiles.section_id from the student_registry section_code.
--    Idempotent: returns existing section code if already assigned.
CREATE OR REPLACE FUNCTION public.complete_sorting_hat()
RETURNS char(1)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _email       text;
  _code        char(1);
  _section_id  uuid;
  _current     uuid;
BEGIN
  -- Already assigned? Return existing code (idempotent).
  SELECT p.section_id INTO _current
  FROM profiles p
  WHERE p.id = auth.uid();

  IF _current IS NOT NULL THEN
    SELECT s.code INTO _code
    FROM sections s WHERE s.id = _current;
    RETURN _code;
  END IF;

  -- Look up caller's email
  _email := lower(coalesce(
    (SELECT u.email FROM auth.users u WHERE u.id = auth.uid()),
    ''
  ));

  -- Get section from registry
  SELECT sr.section_code INTO _code
  FROM student_registry sr
  WHERE sr.email = _email;

  IF NOT FOUND OR _code IS NULL THEN
    RAISE EXCEPTION 'No section assignment found for your account';
  END IF;

  -- Resolve to section UUID
  SELECT s.id INTO _section_id
  FROM sections s
  WHERE s.code = _code;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid section code: %', _code;
  END IF;

  -- Update profile
  UPDATE profiles
  SET section_id = _section_id
  WHERE id = auth.uid();

  RETURN _code;
END;
$$;

-- Grant to authenticated users
GRANT EXECUTE ON FUNCTION public.complete_sorting_hat() TO authenticated;
