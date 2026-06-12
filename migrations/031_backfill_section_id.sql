-- ============================================================================
-- Backfill section_id for profiles where it is NULL
-- ============================================================================
-- Joins profiles → student_registry (by email) → sections (by section_code)
-- Only updates rows where profiles.section_id IS NULL and a valid mapping exists.

UPDATE public.profiles p
SET section_id = s.id
FROM public.student_registry sr
JOIN public.sections s ON s.code = sr.section_code
WHERE p.section_id IS NULL
  AND lower(p.email) = lower(sr.email)
  AND sr.section_code IS NOT NULL;
