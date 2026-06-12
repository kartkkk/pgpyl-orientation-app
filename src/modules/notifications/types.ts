import type { VisibilityScope, NotificationStatus } from "@/types";

export interface NotificationFormData {
  title: string;
  body: string;
  deep_link?: string;
  visibility: VisibilityScope;
  section_ids: string[];
  profile_ids: string[];
  event_id?: string;
  scheduled_at?: string; // ISO string for deferred delivery, null = send immediately
}

export interface NotificationFilters {
  search?: string;
  status?: NotificationStatus;
}
