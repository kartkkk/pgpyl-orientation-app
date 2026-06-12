import type { VisibilityScope } from "@/types";

export interface EventFormData {
  title: string;
  description: string;
  venue: string;
  starts_at: string;
  ends_at: string;
  visibility: VisibilityScope;
  section_ids: string[];
  profile_ids: string[];
}

export interface EventFilters {
  search?: string;
  upcoming?: boolean;
  past?: boolean;
  includeCancelled?: boolean;
  sectionId?: string;
  dateFrom?: string;
  dateTo?: string;
}
