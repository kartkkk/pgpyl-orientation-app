-- ============================================================================
-- Inside The Atrium — Score Audit Log Read RPC
-- Lets any authenticated user read leaderboard score audit data, including
-- section metadata and the changer's display name, without broadening profile
-- table read access across the app.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_score_audit_log(
  p_offset INTEGER DEFAULT 0,
  p_limit INTEGER DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  section_id UUID,
  changed_by UUID,
  old_score INTEGER,
  new_score INTEGER,
  delta INTEGER,
  reason TEXT,
  created_at TIMESTAMPTZ,
  section JSONB,
  profile JSONB
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    sal.id,
    sal.section_id,
    sal.changed_by,
    sal.old_score,
    sal.new_score,
    sal.delta,
    sal.reason,
    sal.created_at,
    jsonb_build_object(
      'id', s.id,
      'code', s.code,
      'name', s.name
    ) AS section,
    jsonb_build_object(
      'id', p.id,
      'full_name', p.full_name
    ) AS profile
  FROM public.score_audit_log sal
  JOIN public.sections s
    ON s.id = sal.section_id
  JOIN public.profiles p
    ON p.id = sal.changed_by
  WHERE auth.role() = 'authenticated'
  ORDER BY sal.created_at DESC
  OFFSET GREATEST(COALESCE(p_offset, 0), 0)
  LIMIT CASE
    WHEN p_limit IS NULL THEN NULL
    ELSE GREATEST(p_limit, 0)
  END;
$$;

GRANT EXECUTE ON FUNCTION public.get_score_audit_log(INTEGER, INTEGER) TO authenticated;