import type { SectionCode } from "@/types";

export interface StudentFormData {
  full_name: string;
  email: string;
  roll_number: string;
  section_code: SectionCode;
}

export interface CSVColumnMapping {
  full_name: string | null;
  email: string | null;
  roll_number: string | null;
  section: string | null;
}

export interface CSVParseResult {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
}

export interface CSVValidationError {
  row: number;
  field: string;
  message: string;
}

export interface BulkUploadResult {
  success: number;
  failed: number;
  errors: CSVValidationError[];
  failedEmails?: string[];
}

export interface StudentFilters {
  search?: string;
  sectionId?: string;
  role?: "admin" | "student";
}
