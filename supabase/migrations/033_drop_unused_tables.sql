-- ============================================================================
-- Drop unused tables: student_bodies, student_body_members, important_contacts,
-- calendar_sync_log
-- ============================================================================

-- Drop tables directly (IF EXISTS handles cases where they were never created)
DROP TABLE IF EXISTS public.student_body_members;
DROP TABLE IF EXISTS public.student_bodies;
DROP TABLE IF EXISTS public.important_contacts;
DROP TABLE IF EXISTS public.calendar_sync_log;

-- Drop enum type used by student_bodies
DROP TYPE IF EXISTS public.student_body_type;

-- Clean up the helper functions from migrations 018/019
DROP FUNCTION IF EXISTS public.drop_deprecated_student_bodies_schema();
DROP FUNCTION IF EXISTS public.drop_deprecated_important_contacts_table();
