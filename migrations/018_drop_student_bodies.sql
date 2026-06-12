-- ============================================================================
-- Student Bodies schema cleanup helper (run manually after PWA rollout window)
-- ============================================================================

-- NOTE:
-- This migration intentionally does not drop tables immediately because stale
-- PWA clients may still reference them until service worker refresh completes.
-- Execute the helper function manually once rollout safety criteria are met.

CREATE OR REPLACE FUNCTION public.drop_deprecated_student_bodies_schema()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
	-- Drop policies first to avoid dependency errors on some Postgres setups
	DROP POLICY IF EXISTS "student_body_members: anyone reads" ON public.student_body_members;
	DROP POLICY IF EXISTS "student_body_members: admin all" ON public.student_body_members;
	DROP POLICY IF EXISTS "student_bodies: anyone reads" ON public.student_bodies;
	DROP POLICY IF EXISTS "student_bodies: admin all" ON public.student_bodies;

	-- Drop child table first due FK dependency
	DROP TABLE IF EXISTS public.student_body_members;
	DROP TABLE IF EXISTS public.student_bodies;

	-- Drop enum type after tables are removed
	DROP TYPE IF EXISTS public.student_body_type;
END;
$$;

COMMENT ON FUNCTION public.drop_deprecated_student_bodies_schema() IS
	'Manual cleanup helper: execute after all active clients are on static Student Bodies catalog.';
