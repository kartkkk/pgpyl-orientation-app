-- ============================================================================
-- Email-login auth rules for PGP YL 2028
-- ============================================================================
-- No student registry is required for app access.
-- - Explicit personal emails below are admins.
-- - Emails ending in _pgpyl2028@isb.edu are students.
-- - Everyone else can authenticate, but no profile is created and the app blocks access.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _email text;
  _name  text;
  _role  user_role;
BEGIN
  _email := lower(coalesce(NEW.email, ''));
  _name  := coalesce(
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'name',
    split_part(_email, '@', 1)
  );

  IF _email = ANY (ARRAY[
    'karthik_m@isb.edu',
    'aziz_abdul@isb.edu',
    'anitha_pothini@isb.edu',
    'saniya_arora@isb.edu',
    'tvs_pradeep@isb.edu'
  ]) THEN
    _role := 'admin';
  ELSIF right(_email, length('_pgpyl2028@isb.edu')) = '_pgpyl2028@isb.edu' THEN
    _role := 'student';
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (NEW.id, _name, _email, _role)
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    updated_at = now();

  RETURN NEW;
END;
$$;

-- Backfill profiles for matching users who already authenticated before this
-- migration was applied.
INSERT INTO public.profiles (id, full_name, email, role)
SELECT
  users.id,
  coalesce(
    users.raw_user_meta_data ->> 'full_name',
    users.raw_user_meta_data ->> 'name',
    split_part(lower(users.email), '@', 1)
  ) AS full_name,
  lower(users.email) AS email,
  CASE
    WHEN lower(users.email) = ANY (ARRAY[
      'karthik_m@isb.edu',
      'aziz_abdul@isb.edu',
      'anitha_pothini@isb.edu',
      'saniya_arora@isb.edu',
      'tvs_pradeep@isb.edu'
    ]) THEN 'admin'::user_role
    ELSE 'student'::user_role
  END AS role
FROM auth.users
WHERE
  lower(users.email) = ANY (ARRAY[
    'karthik_m@isb.edu',
    'aziz_abdul@isb.edu',
    'anitha_pothini@isb.edu',
    'saniya_arora@isb.edu',
    'tvs_pradeep@isb.edu'
  ])
  OR right(lower(users.email), length('_pgpyl2028@isb.edu')) = '_pgpyl2028@isb.edu'
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  updated_at = now();
