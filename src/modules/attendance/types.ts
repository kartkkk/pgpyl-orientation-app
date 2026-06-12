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

// ─── Attendance Export ─────────────────────────────────────────────────────

export interface AttendanceExportRow {
  "Full Name": string;
  "PG ID": string;
  Email: string;
  Section: string;
  Status: "Present" | "Absent";
  "Scanned At": string;
}
