-- ============================================================================
-- PIN login for approved PGP YL students
-- ============================================================================
-- Student PII is intentionally not committed in this migration.
-- Seed allowed_students separately from the private student spreadsheet.

CREATE TABLE IF NOT EXISTS public.allowed_students (
  email         text PRIMARY KEY,
  full_name     text NOT NULL,
  first_name    text,
  last_name     text,
  pin_set_at    timestamptz,
  last_login_at timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.allowed_students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allowed_students: admin read" ON public.allowed_students;
CREATE POLICY "allowed_students: admin read"
  ON public.allowed_students
  FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "allowed_students: admin update" ON public.allowed_students;
CREATE POLICY "allowed_students: admin update"
  ON public.allowed_students
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

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
  _reg   record;
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
  ELSE
    SELECT * INTO _reg
    FROM public.allowed_students
    WHERE allowed_students.email = _email;

    IF NOT FOUND THEN
      RETURN NEW;
    END IF;

    _role := 'student';
    _name := coalesce(_reg.full_name, _name);
  END IF;

  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (NEW.id, _name, _email, _role)
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
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
    allowed_students.full_name,
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
LEFT JOIN public.allowed_students
  ON allowed_students.email = lower(users.email)
WHERE
  lower(users.email) = ANY (ARRAY[
    'karthik_m@isb.edu',
    'aziz_abdul@isb.edu',
    'anitha_pothini@isb.edu',
    'saniya_arora@isb.edu',
    'tvs_pradeep@isb.edu'
  ])
  OR allowed_students.email IS NOT NULL
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  updated_at = now();
