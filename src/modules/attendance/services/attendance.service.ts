import { supabase } from "@/lib/supabase";
import type { AttendanceSession, AttendanceRecord, AttendanceAuditAction, AttendanceAuditLog, Event, Profile } from "@/types";
import type { AttendanceSessionWithEvent, AttendanceExportRow } from "../types";

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
    .select("*, event:events(*)")
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

  // Broadcast session_closed so student devices stop showing the QR.
  // Fire-and-forget — the DB update is the source of truth; the broadcast is
  // best-effort notification.  We must subscribe before sending, and use a
  // unique channel name to avoid colliding with the admin's QR rotation channel.
  const closeChannel = supabase.channel(`attendance-close:${sessionId}`);
  closeChannel.subscribe((status) => {
    if (status === "SUBSCRIBED") {
      closeChannel
        .send({
          type: "broadcast",
          event: "session_closed",
          payload: { session_id: sessionId, closed_at: data.closed_at },
        })
        .finally(() => supabase.removeChannel(closeChannel));
    }
  });

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
    .select("*, event:events(*)")
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

// ─── QR Tokens ─────────────────────────────────────────────────────────────
// Token generation is handled exclusively by the server-side cron function
// (rotate-qr-token). Client code polls for the latest valid token.

/** The active QR payload: the long token (encoded in the QR) and the short
 *  6-digit manual-entry code shown beneath it. */
export interface LatestToken {
  token: string;
  code: string | null;
}

/**
 * Fetches the latest valid (non-expired) QR token for a session.
 * Returns `null` when no valid token exists yet.
 */
export async function fetchLatestToken(sessionId: string): Promise<LatestToken | null> {
  const { data, error } = await supabase
    .from("qr_tokens")
    .select("token, code")
    .eq("session_id", sessionId)
    .gt("valid_until", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data?.token) return null;
  return { token: data.token, code: data.code ?? null };
}

/**
 * Validates a scanned QR token and marks attendance for the current user.
 *
 * Uses `supabase.functions.invoke` so the SDK handles auth headers in the
 * exact format the Supabase gateway expects.  The edge function is deployed
 * with `--no-verify-jwt` so the gateway passes the request through and our
 * function code handles auth via a direct GoTrue call.
 */
const MARK_TIMEOUT_MS = 15_000;

type MarkResult = { message: string; event_title?: string; already_recorded?: boolean };

/** Invoke the edge function with a timeout guard. */
function invokeMarkAttendance(token: string) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([
    supabase.functions.invoke("mark-attendance", { body: { token } }),
    new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error("Request timed out. Please try again.")),
        MARK_TIMEOUT_MS,
      );
    }),
  ]).finally(() => clearTimeout(timer));
}

/** Check whether a functions error is a 401 auth failure. */
function isAuthError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const ctx = (error as { context?: unknown }).context;
  return ctx instanceof Response && ctx.status === 401;
}

export async function markAttendance(token: string): Promise<MarkResult> {
  let { data, error } = await invokeMarkAttendance(token);

  // Retry once on auth failure after refreshing the session token.
  if (isAuthError(error)) {
    const { error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) {
      throw new Error("Session expired. Please log in again.");
    }
    ({ data, error } = await invokeMarkAttendance(token));
  }

  if (error) {
    // FunctionsHttpError stores the raw Response in error.context.
    // Read the JSON body to get the actual server error message.
    let serverMessage: string | undefined;
    try {
      if (error.context instanceof Response) {
        const body = await error.context.json();
        serverMessage = body?.error;
      }
    } catch {
      // Response body not readable or not JSON — fall through
    }
    throw new Error(serverMessage || error.message || "Failed to mark attendance");
  }

  if (!data) {
    throw new Error("No response from server. Please try again.");
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return data as MarkResult;
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

// ─── Export ────────────────────────────────────────────────────────────────

/**
 * Builds an attendance report for an event, listing all relevant students
 * with their present/absent status.
 *
 * The audience is determined by the event's `visibility` scope:
 * - `"all"` → every active student
 * - `"section"` → students in assigned sections only
 * - `"individual"` → individually assigned students only
 */
export async function exportAttendanceReport(
  eventId: string,
): Promise<{ rows: AttendanceExportRow[]; event: Event }> {
  // 1. Fetch event + latest session in parallel (independent queries)
  const [eventResult, sessionsResult] = await Promise.all([
    supabase
      .from("events")
      .select("*, event_assignments(*)")
      .eq("id", eventId)
      .single(),
    supabase
      .from("attendance_sessions")
      .select("id")
      .eq("event_id", eventId)
      .order("opened_at", { ascending: false })
      .limit(1),
  ]);

  if (eventResult.error || !eventResult.data) throw new Error("Event not found");
  const event = eventResult.data;
  const sessionId = sessionsResult.data?.[0]?.id;

  // 2. Fetch audience + attendance records in parallel
  const audiencePromise = fetchAudience(event);
  const recordsPromise = sessionId
    ? supabase
        .from("attendance_records")
        .select("profile_id, scanned_at")
        .eq("session_id", sessionId)
    : Promise.resolve({ data: [] as { profile_id: string; scanned_at: string }[] });

  const [audience, recordsResult] = await Promise.all([audiencePromise, recordsPromise]);

  if ("error" in recordsResult && recordsResult.error) {
    throw new Error(`Failed to load attendance records: ${recordsResult.error.message}`);
  }

  const attendanceMap = new Map<string, string>();
  const records = ("data" in recordsResult ? recordsResult.data : recordsResult) ?? [];
  for (const r of records) {
    attendanceMap.set(r.profile_id, r.scanned_at);
  }

  // 3. Build export rows
  const rows: AttendanceExportRow[] = audience.map((student) => {
    const scannedAt = attendanceMap.get(student.id);
    return {
      "Full Name": student.full_name,
      "PG ID": student.roll_number ?? "—",
      Email: student.email,
      Section: student.section?.code ?? "—",
      Status: scannedAt ? "Present" : "Absent",
      "Scanned At": scannedAt
        ? new Date(scannedAt).toLocaleString()
        : "—",
    };
  });

  return { rows, event: event as Event };
}

/** Resolves the audience for an event based on its visibility scope. */
async function fetchAudience(
  event: { visibility: string; event_assignments: { section_id: string | null; profile_id: string | null }[] },
): Promise<Profile[]> {
  if (event.visibility === "all") {
    const { data, error } = await supabase
      .from("profiles")
      .select("*, section:sections(*)")
      .eq("is_active", true)
      .eq("role", "student")
      .order("full_name");
    if (error) throw error;
    return (data ?? []) as Profile[];
  }

  if (event.visibility === "section") {
    const sectionIds = event.event_assignments
      .filter((a) => a.section_id !== null)
      .map((a) => a.section_id!);

    if (sectionIds.length === 0) return [];

    const { data, error } = await supabase
      .from("profiles")
      .select("*, section:sections(*)")
      .eq("is_active", true)
      .eq("role", "student")
      .in("section_id", sectionIds)
      .order("full_name");
    if (error) throw error;
    return (data ?? []) as Profile[];
  }

  if (event.visibility === "individual") {
    const profileIds = event.event_assignments
      .filter((a) => a.profile_id !== null)
      .map((a) => a.profile_id!);

    if (profileIds.length === 0) return [];

    const { data, error } = await supabase
      .from("profiles")
      .select("*, section:sections(*)")
      .in("id", profileIds)
      .order("full_name");
    if (error) throw error;
    return (data ?? []) as Profile[];
  }

  return [];
}
