import type { AttendanceSession, Event } from "@/types";

// ─── Attendance Session with Event ─────────────────────────────────────────

export interface AttendanceSessionWithEvent extends AttendanceSession {
  event: Event;
}

// ─── Attendance Stats ──────────────────────────────────────────────────────

export interface AttendanceStats {
  total: number;
  present: number;
  percentage: number;
}
