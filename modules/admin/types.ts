export interface AdminInfo {
  id: string;
  full_name: string;
  email: string;
  promoted_by: string | null;
  promoted_at: string | null;
  // joined — Supabase returns array for self-referencing FK joins
  promoter?: { full_name: string }[] | null;
}

export interface PromoteFormData {
  profile_id: string;
}

export interface DemoteFormData {
  profile_id: string;
  section_id: string; // must reassign to a section when demoting
}
