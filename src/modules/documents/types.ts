import type { VisibilityScope } from "@/types";

export interface DocumentFormData {
  title: string;
  url: string;
  description?: string;
  visibility: VisibilityScope;
  section_ids: string[];
  profile_ids: string[];
}

export interface DocumentFilters {
  search?: string;
  visibility?: VisibilityScope;
}
