-- ============================================================================
-- Inside The Atrium — Auto-create profile on new user signup (Microsoft OAuth)
-- ============================================================================

-- When a new user signs in via Microsoft OAuth, Supabase creates an auth.users
-- row. This trigger auto-creates the corresponding profiles row with the
-- correct role based on email pattern:
--   *_pgp2026@isb.edu → admin
--   all others        → student
-- Email is always stored in lowercase.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _email    text;
  _name     text;
  _role     user_role;
BEGIN
  _email := lower(coalesce(NEW.email, ''));
  _name  := coalesce(
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'name',
    split_part(_email, '@', 1)
  );

  IF _email LIKE '%\_pgp2026@isb.edu' THEN
    _role := 'admin';
  ELSE
    _role := 'student';
  END IF;

  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (NEW.id, _name, _email, _role)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if any, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
