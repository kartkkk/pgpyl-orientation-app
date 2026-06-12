-- ============================================================================
-- Whitelist-gated auth trigger — only registered students get a profile
-- ============================================================================
-- Replaces the original handle_new_user() from 010_auth_auto_profile.sql.
-- Now checks student_registry before creating a profile:
--   1. Admins (_pgp2026@isb.edu) always get a profile (no registry check)
--   2. Students must exist in student_registry — profile is pre-filled with
--      roll_number, phone_number, and gender from the registry
--   3. Everyone else: no profile created (app blocks access)

-- Add gender column to profiles (not present yet)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gender text;

-- Replace the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _email       text;
  _name        text;
  _role        user_role;
  _reg         record;
BEGIN
  _email := lower(coalesce(NEW.email, ''));
  _name  := coalesce(
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'name',
    split_part(_email, '@', 1)
  );

  -- Admin bypass: PGP2026 emails are admins (O-Week team / faculty)
  IF _email LIKE '%\_pgp2026@isb.edu' THEN
    INSERT INTO public.profiles (id, full_name, email, role)
    VALUES (NEW.id, _name, _email, 'admin')
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
  END IF;

  -- Student whitelist check
  SELECT * INTO _reg
  FROM public.student_registry
  WHERE student_registry.email = _email;

  IF NOT FOUND THEN
    -- Not in registry → no profile created → app will show error
    RETURN NEW;
  END IF;

  -- Create profile with pre-filled data from registry
  INSERT INTO public.profiles (
    id, full_name, email, role,
    roll_number, phone_number, gender
  )
  VALUES (
    NEW.id,
    coalesce(_reg.full_name, _name),
    _email,
    'student',
    _reg.student_id,
    _reg.mobile,
    _reg.gender
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Client-side inserts are not allowed. The auth trigger above is the only path
-- that should create profile rows.
DROP POLICY IF EXISTS "profiles: self insert on signup" ON public.profiles;