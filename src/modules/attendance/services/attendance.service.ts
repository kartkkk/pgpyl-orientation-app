import { supabase } from "@/lib/supabase";
import type { AttendanceSession, AttendanceRecord, AttendanceAuditAction, AttendanceAuditLog } from "@/types";
import type { AttendanceSessionWithEvent } from "../types";

// ─── Sessions ──────────────────────────────────────────────────────────────

/**
 * Opens a new attendance session for an event.
 * The `opened_by` field is populated from the authenticated user's JWT by the
 * database default / RLS policy, but we also set it explicitly for clarity.
 */
export async function openSession(eventId: string, userId: string): Promise<AttendanceSessionWithEvent> {
  const { data, error } = await supabase
    .from("attendance_sessions")
    .insert({
      event_id: eventId,
      opened_by: userId,
      is_open: true,
    })
    .select("*")
    .single();

  if (error) throw error;

  // Fire-and-forget — audit is non-critical
  void writeAttendanceAudit(data.id, eventId, "session_opened", userId);

  return data as AttendanceSessionWithEvent;
}

/**
 * Closes an active attendance session.
 */
export async function closeSession(sessionId: string, userId: string): Promise<AttendanceSession> {
  const { data, error } = await supabase
    .from("attendance_sessions")
    .update({
      is_open: false,
      closed_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .select("*")
    .single();

  if (error) throw error;

  // Fire-and-forget — audit is non-critical
  void writeAttendanceAudit(data.id, data.event_id, "session_closed", userId);

  return data as AttendanceSession;
}

/**
 * Fetches the currently active (open) session for an event, if one exists.
 * Returns `null` when no open session is found.
 */
export async function fetchSessionForEvent(
  eventId: string,
): Promise<AttendanceSessionWithEvent | null> {
  const { data, error } = await supabase
    .from("attendance_sessions")
    .select("*")
    .eq("event_id", eventId)
    .eq("is_open", true)
    .order("opened_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as AttendanceSessionWithEvent | null;
}

// ─── Attendance Records ────────────────────────────────────────────────────

/**
 * Fetches every attendance record for a given student, joining the session's
 * event so we can display contextual information.
 */
export async function fetchMyAttendance(
  profileId: string,
): Promise<(AttendanceRecord & { session: AttendanceSessionWithEvent })[]> {
  const { data, error } = await supabase
    .from("attendance_records")
    .select("*, session:attendance_sessions(*, event:events(*))")
    .eq("profile_id", profileId)
    .order("scanned_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as (AttendanceRecord & {
    session: AttendanceSessionWithEvent;
  })[];
}

// ─── Attendance Codes ──────────────────────────────────────────────────────

/**
 * Validates an attendance code and marks attendance for the current user.
 */
const MARK_TIMEOUT_MS = 15_000;

type MarkResult = { message: string; event_title?: string; already_recorded?: boolean };

export async function markAttendance(token: string): Promise<MarkResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MARK_TIMEOUT_MS);

  try {
    const response = await fetch("/api/attendance/mark", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
      signal: controller.signal,
    });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.error || "Failed to mark attendance");
    }

    if (!data) {
      throw new Error("No response from server. Please try again.");
    }

    return data as MarkResult;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timed out. Please try again.");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Audit Log ──────────────────────────────────────────────────────────────

/**
 * Writes an audit log entry for an attendance action.
 */
export async function writeAttendanceAudit(
  sessionId: string,
  eventId: string,
  action: AttendanceAuditAction,
  performedBy: string,
  detail?: string,
): Promise<void> {
  const { error } = await supabase.from("attendance_audit_log").insert({
    session_id: sessionId,
    event_id: eventId,
    action,
    performed_by: performedBy,
    detail: detail?.trim() || null,
  });

  if (error) {
    // Non-critical — log but don't fail the parent operation
    console.warn("Failed to write attendance audit log:", error.message);
  }
}

/**
 * Fetches attendance audit log entries for an event.
 */
export async function fetchAttendanceAuditLog(
  eventId: string,
  limit = 50,
): Promise<AttendanceAuditLog[]> {
  const { data, error } = await supabase
    .from("attendance_audit_log")
    .select("*, profile:profiles(id, full_name)")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as AttendanceAuditLog[];
}
