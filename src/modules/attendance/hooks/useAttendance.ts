import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Papa from "papaparse";
import {
  openSession,
  closeSession,
  fetchSessionForEvent,
  markAttendance,
  fetchMyAttendance,
  fetchAttendanceAuditLog,
  exportAttendanceReport,
} from "../services/attendance.service";
import { useAuth } from "@/modules/auth/auth-context";

// ─── Query Keys ────────────────────────────────────────────────────────────

const ATTENDANCE_SESSION_KEY = "attendance-session";
const MY_ATTENDANCE_KEY = "my-attendance";
const ATTENDANCE_AUDIT_KEY = "attendance-audit-log";

// ─── Queries ───────────────────────────────────────────────────────────────

/**
 * Fetches the active attendance session for an event.
 * Returns `null` when no open session exists.
 */
export function useAttendanceSession(eventId: string | undefined) {
  return useQuery({
    queryKey: [ATTENDANCE_SESSION_KEY, eventId],
    queryFn: () => fetchSessionForEvent(eventId!),
    enabled: !!eventId,
  });
}

/**
 * Fetches all attendance records for a given student.
 */
export function useMyAttendance(profileId: string | undefined) {
  return useQuery({
    queryKey: [MY_ATTENDANCE_KEY, profileId],
    queryFn: () => fetchMyAttendance(profileId!),
    enabled: !!profileId,
  });
}

// ─── Mutations ─────────────────────────────────────────────────────────────

/**
 * Opens a new attendance session for an event.
 * Invalidates the session query so the UI reflects the new state immediately.
 */
export function useOpenSession() {
  const qc = useQueryClient();
  const { profile } = useAuth();
  return useMutation({
    mutationFn: (eventId: string) => openSession(eventId, profile!.id),
    onSuccess: (data, eventId) => {
      // Set the session data directly so the UI updates immediately
      // instead of waiting for a background refetch.
      qc.setQueryData([ATTENDANCE_SESSION_KEY, eventId], data);
      qc.invalidateQueries({ queryKey: [ATTENDANCE_AUDIT_KEY, eventId] });
    },
  });
}

/**
 * Closes an attendance session.
 * Invalidates both the session query and the attendance list.
 */
export function useCloseSession() {
  const qc = useQueryClient();
  const { profile } = useAuth();
  return useMutation({
    mutationFn: (sessionId: string) => closeSession(sessionId, profile!.id),
    onSuccess: (_data, sessionId) => {
      // Invalidate the session query for the parent event
      qc.invalidateQueries({ queryKey: [ATTENDANCE_SESSION_KEY] });
      qc.invalidateQueries({ queryKey: [ATTENDANCE_AUDIT_KEY] });
    },
  });
}

/**
 * Fetches attendance audit log entries for an event.
 */
export function useAttendanceAuditLog(eventId: string | undefined) {
  return useQuery({
    queryKey: [ATTENDANCE_AUDIT_KEY, eventId],
    queryFn: () => fetchAttendanceAuditLog(eventId!),
    enabled: !!eventId,
  });
}

/**
 * Validates a scanned QR token and marks attendance.
 * On success, invalidates the student's attendance history.
 */
export function useMarkAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => markAttendance(token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [MY_ATTENDANCE_KEY] });
    },
  });
}

/**
 * Exports attendance for an event as a CSV file download.
 * Fetches the full audience (based on event visibility) and cross-references
 * with attendance records to mark each student as Present or Absent.
 */
export function useExportAttendance() {
  return useMutation({
    mutationFn: async (eventId: string) => {
      const { rows, event } = await exportAttendanceReport(eventId);

      // Generate CSV using papaparse
      const csv = Papa.unparse(rows);

      // Trigger browser download
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      const dateStr = new Date(event.starts_at).toISOString().slice(0, 10);
      const safeTitle = event.title.replace(/[^a-zA-Z0-9-_ ]/g, "").trim();
      link.href = url;
      link.download = `attendance-${safeTitle}-${dateStr}.csv`;
      link.click();

      URL.revokeObjectURL(url);
      return { count: rows.length };
    },
  });
}
