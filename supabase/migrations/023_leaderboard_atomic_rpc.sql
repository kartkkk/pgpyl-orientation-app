-- Add version column for optimistic locking on "set" mode updates
ALTER TABLE public.section_leaderboard
  ADD COLUMN version INTEGER NOT NULL DEFAULT 0;

-- ─── Atomic adjust (relative) ───────────────────────────────────────────────
-- Single atomic UPDATE — no read-then-write, no race condition possible.

CREATE OR REPLACE FUNCTION update_score_adjust(
  p_section_id UUID,
  p_delta      INTEGER,
  p_user_id    UUID,
  p_reason     TEXT DEFAULT NULL
)
RETURNS TABLE(old_score INTEGER, new_score INTEGER) AS $$
DECLARE
  v_old INTEGER;
  v_new INTEGER;
BEGIN
  UPDATE section_leaderboard
  SET score      = score + p_delta,
      version    = version + 1,
      updated_by = p_user_id,
      updated_at = NOW()
  WHERE section_id = p_section_id
  RETURNING score - p_delta, score INTO v_old, v_new;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Section not found: %', p_section_id;
  END IF;

  INSERT INTO score_audit_log (id, section_id, changed_by, old_score, new_score, delta, reason)
  VALUES (gen_random_uuid(), p_section_id, p_user_id, v_old, v_new, p_delta, p_reason);

  RETURN QUERY SELECT v_old, v_new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Optimistic-locked set (absolute) ───────────────────────────────────────
-- Uses a version column to detect concurrent modifications.

CREATE OR REPLACE FUNCTION update_score_set(
  p_section_id       UUID,
  p_new_score        INTEGER,
  p_expected_version INTEGER,
  p_user_id          UUID,
  p_reason           TEXT DEFAULT NULL
)
RETURNS TABLE(old_score INTEGER, new_score INTEGER, new_version INTEGER) AS $$
DECLARE
  v_old     INTEGER;
  v_new_ver INTEGER;
BEGIN
  -- Read old score before the update
  SELECT score INTO v_old
  FROM section_leaderboard
  WHERE section_id = p_section_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Section not found: %', p_section_id;
  END IF;

  -- Conditional update with version check
  UPDATE section_leaderboard
  SET score      = p_new_score,
      version    = version + 1,
      updated_by = p_user_id,
      updated_at = NOW()
  WHERE section_id = p_section_id
    AND version = p_expected_version
  RETURNING version INTO v_new_ver;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conflict: score was modified by another admin. Please refresh.';
  END IF;

  INSERT INTO score_audit_log (id, section_id, changed_by, old_score, new_score, delta, reason)
  VALUES (gen_random_uuid(), p_section_id, p_user_id, v_old, p_new_score, p_new_score - v_old, p_reason);

  RETURN QUERY SELECT v_old, p_new_score, v_new_ver;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
