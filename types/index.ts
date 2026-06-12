// Convention:
//   types/index.ts       -- database row types matching the Supabase schema.
//   modules/*/types.ts   -- form data, filter objects, and module-specific types.

// ─── Section ────────────────────────────────────────────────────────────────

export type SectionCode = "A" | "B";

export interface Section {
  id: string;
  code: SectionCode;
  name: string;
  created_at: string;
}

// ─── User / Profile ─────────────────────────────────────────────────────────

export type UserRole = "admin" | "student";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  section_id: string | null;
  roll_number: string | null;
  avatar_url: string | null;
  phone_number: string | null;
  about_me: string | null;
  fcm_token: string | null;
  is_active: boolean;
  promoted_by: string | null;
  promoted_at: string | null;
  created_at: string;
  updated_at: string;
  // joined
  section?: Section;
}

// ─── Visibility (shared across events, documents, notifications) ────────────

export type VisibilityScope = "all" | "section" | "individual";

// ─── Events ─────────────────────────────────────────────────────────────────

export interface Event {
  id: string;
  title: string;
  description: string | null;
  venue: string | null;
  starts_at: string;
  ends_at: string | null;
  visibility: VisibilityScope;
  outlook_event_id: string | null;
  outlook_calendar_id: string | null;
  ical_uid: string | null;
  is_cancelled: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface EventAssignment {
  id: string;
  event_id: string;
  section_id: string | null;
  profile_id: string | null;
  created_at: string;
}

// ─── Attendance ─────────────────────────────────────────────────────────────

export interface AttendanceSession {
  id: string;
  event_id: string;
  opened_by: string;
  opened_at: string;
  closed_at: string | null;
  is_open: boolean;
  // joined
  event?: Event;
}

export interface QRToken {
  id: string;
  session_id: string;
  token: string;
  valid_from: string;
  valid_until: string;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  session_id: string;
  profile_id: string;
  qr_token_id: string;
  scanned_at: string;
  is_manual: boolean;
  overridden_by: string | null;
  // joined
  profile?: Profile;
}

// ─── Documents ──────────────────────────────────────────────────────────────

export interface Document {
  id: string;
  title: string;
  url: string;
  description: string | null;
  visibility: VisibilityScope;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentAssignment {
  id: string;
  document_id: string;
  section_id: string | null;
  profile_id: string | null;
  created_at: string;
}

// ─── Notifications ──────────────────────────────────────────────────────────

export type NotificationStatus =
  | "draft"
  | "scheduled"
  | "sending"
  | "sent"
  | "failed";

export interface Notification {
  id: string;
  title: string;
  body: string;
  deep_link: string | null;
  visibility: VisibilityScope;
  status: NotificationStatus;
  event_id: string | null;
  scheduled_at: string | null;
  sent_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationAssignment {
  id: string;
  notification_id: string;
  section_id: string | null;
  profile_id: string | null;
  created_at: string;
}

export interface NotificationDelivery {
  id: string;
  notification_id: string;
  profile_id: string;
  push_token: string;
  delivered_at: string | null;
  read_at: string | null;
  error_message: string | null;
  created_at: string;
}

// ─── Groups ──────────────────────────────────────────────────────────────────

export type GroupMemberStatus = "invited" | "active" | "declined";

export interface Group {
  id: string;
  name: string;
  created_by: string;
  is_admin_created: boolean;
  created_at: string;
  updated_at: string;
  // joined
  creator?: Profile;
  members?: GroupMember[];
  member_count?: number;
}

export interface GroupMember {
  id: string;
  group_id: string;
  profile_id: string;
  status: GroupMemberStatus;
  invited_by: string | null;
  joined_at: string | null;
  created_at: string;
  updated_at: string;
  // joined
  profile?: Profile;
  group?: Group;
}

// ─── Section Wars Leaderboard ───────────────────────────────────────────────

export interface LeaderboardEntry {
  id: string;
  section_id: string;
  score: number;
  version: number;
  updated_by: string | null;
  updated_at: string;
  created_at: string;
  // joined
  section?: Section;
}

// ─── Score Audit Log ────────────────────────────────────────────────────────

export interface ScoreAuditLog {
  id: string;
  section_id: string;
  changed_by: string;
  old_score: number;
  new_score: number;
  delta: number;
  reason: string | null;
  created_at: string;
  // joined
  section?: Section;
  profile?: Profile;
}

// ─── Attendance Audit Log ───────────────────────────────────────────────────

export type AttendanceAuditAction = "session_opened" | "session_closed";

export interface AttendanceAuditLog {
  id: string;
  session_id: string;
  event_id: string;
  action: AttendanceAuditAction;
  performed_by: string;
  detail: string | null;
  created_at: string;
  // joined
  profile?: Profile;
}

// ─── Student Bodies ─────────────────────────────────────────────────────────

export type StudentBodyType = "gsb" | "club" | "sig";
export type StudentBodyClubSubtype = "professional" | "social";
export type StudentBodySubtypeSource = "manual" | "predicted";
export type StudentBodySubtypeConfidence = "high" | "medium" | "low";

export interface StudentBodiesCatalog {
  catalog_version: number;
  updated_at: string;
  bodies: StudentBody[];
}

export interface StudentBody {
  id: string;
  type: StudentBodyType;
  name: string;
  description: string | null;
  club_subtype: StudentBodyClubSubtype | null;
  club_subtype_source: StudentBodySubtypeSource | null;
  club_subtype_confidence: StudentBodySubtypeConfidence | null;
  club_subtype_reason: string | null;
  members: StudentBodyMember[];
}

export interface StudentBodyMember {
  id: string;
  member_name: string;
  role: string;
  email: string | null;
  display_order: number;
}

// ─── Important Contacts ─────────────────────────────────────────────────────

export interface ImportantContact {
  id: string;
  body_name: string;
  poc_name: string;
  phone_number: string | null;
  email: string | null;
  display_order: number;
}
