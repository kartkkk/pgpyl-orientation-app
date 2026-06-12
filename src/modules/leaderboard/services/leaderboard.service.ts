import { supabase } from "@/lib/supabase";
import type { LeaderboardEntry, ScoreAuditLog } from "@/types";

interface ScoreAuditLogRow {
  id: string;
  section_id: string;
  changed_by: string;
  old_score: number;
  new_score: number;
  delta: number;
  reason: string | null;
  created_at: string;
  section: { id: string; code: string; name: string } | null;
  profile: { id: string; full_name: string | null } | null;
}

function mapScoreAuditLogRow(row: ScoreAuditLogRow): ScoreAuditLog {
  return {
    id: row.id,
    section_id: row.section_id,
    changed_by: row.changed_by,
    old_score: row.old_score,
    new_score: row.new_score,
    delta: row.delta,
    reason: row.reason,
    created_at: row.created_at,
    section: row.section ?? undefined,
    profile: row.profile
      ? {
          id: row.profile.id,
          full_name: row.profile.full_name ?? "Unknown",
        }
      : undefined,
  } as ScoreAuditLog;
}

// ─── Read ────────────────────────────────────────────────────────────────────

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from("section_leaderboard")
    .select("*, section:sections(id, code, name)")
    .order("score", { ascending: false });

  if (error) throw error;
  return (data ?? []) as LeaderboardEntry[];
}

export async function fetchScoreAuditLog(offset = 0, limit = 50): Promise<ScoreAuditLog[]> {
  const { data, error } = await supabase.rpc("get_score_audit_log", {
    p_offset: offset,
    p_limit: limit,
  });

  if (error) throw error;
  return ((data ?? []) as ScoreAuditLogRow[]).map(mapScoreAuditLogRow);
}

export async function fetchFullScoreAuditLog(): Promise<ScoreAuditLog[]> {
  const { data, error } = await supabase.rpc("get_score_audit_log", {
    p_offset: 0,
    p_limit: null,
  });

  if (error) throw error;
  return ((data ?? []) as ScoreAuditLogRow[])
    .map(mapScoreAuditLogRow)
    .reverse();
}

// ─── Write ───────────────────────────────────────────────────────────────────

/**
 * Update a section's score via atomic RPC functions.
 *
 * - "adjust" mode: atomic `score = score + delta` — no race condition possible.
 * - "set" mode: optimistic lock via `version` column — rejects if another admin
 *   modified the score since this client last read it.
 *
 * Both functions also write the audit log entry inside the same transaction.
 */
export async function updateScore(
  sectionId: string,
  score: number,
  mode: "set" | "adjust" = "set",
  reason?: string,
  userId?: string,
  version?: number,
): Promise<void> {
  if (!userId) throw new Error("Not authenticated");

  if (mode === "adjust") {
    const { error } = await supabase.rpc("update_score_adjust", {
      p_section_id: sectionId,
      p_delta: score,
      p_user_id: userId,
      p_reason: reason?.trim() || null,
    });
    if (error) throw new Error(error.message);
  } else {
    if (version === undefined) {
      throw new Error("Version is required for set mode");
    }
    const { error } = await supabase.rpc("update_score_set", {
      p_section_id: sectionId,
      p_new_score: score,
      p_expected_version: version,
      p_user_id: userId,
      p_reason: reason?.trim() || null,
    });
    if (error) {
      throw new Error(
        error.message.includes("Conflict")
          ? "Score was modified by another admin. Please refresh and try again."
          : error.message,
      );
    }
  }
}
