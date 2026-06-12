import { supabase } from "@/lib/supabase";
import { SECTION_CODES } from "@/lib/constants";
import { isValidEmail } from "@/lib/utils";
import type { Profile, Section, SectionCode } from "@/types";
import type {
  StudentFormData,
  StudentFilters,
  CSVColumnMapping,
  CSVValidationError,
  BulkUploadResult,
} from "../types";

// ─── Read ───────────────────────────────────────────────────────────────────

export const STUDENTS_PAGE_SIZE = 50;

export async function fetchStudents(
  filters?: StudentFilters,
  page = 1,
  pageSize = STUDENTS_PAGE_SIZE,
): Promise<Profile[]> {
  let query = supabase
    .from("profiles")
    .select("*, section:sections(*)")
    .order("full_name", { ascending: true });

  if (filters?.search) {
    query = query.or(
      `full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,roll_number.ilike.%${filters.search}%`,
    );
  }
  if (filters?.sectionId) {
    query = query.eq("section_id", filters.sectionId);
  }
  if (filters?.role) {
    query = query.eq("role", filters.role);
  }

  query = query.range((page - 1) * pageSize, page * pageSize - 1);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function fetchStudentById(id: string): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*, section:sections(*)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function fetchSections(): Promise<Section[]> {
  const { data, error } = await supabase
    .from("sections")
    .select("*")
    .order("code", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Section[];
}

// ─── Write ──────────────────────────────────────────────────────────────────

export async function createStudent(form: StudentFormData): Promise<Profile> {
  // Resolve section UUID from code
  const { data: section } = await supabase
    .from("sections")
    .select("id")
    .eq("code", form.section_code)
    .single();

  if (!section) throw new Error(`Section ${form.section_code} not found`);

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      full_name: form.full_name.trim(),
      email: form.email.trim().toLowerCase(),
      roll_number: form.roll_number.trim(),
      section_id: section.id,
      role: "student",
    })
    .select("*, section:sections(*)")
    .single();

  if (error) throw error;
  return data as Profile;
}

export async function updateStudent(
  id: string,
  updates: Partial<StudentFormData>,
): Promise<Profile> {
  const payload: Record<string, unknown> = {};

  if (updates.full_name !== undefined) payload.full_name = updates.full_name.trim();
  if (updates.email !== undefined) payload.email = updates.email.trim().toLowerCase();
  if (updates.roll_number !== undefined) payload.roll_number = updates.roll_number.trim();

  if (updates.section_code !== undefined) {
    const { data: section } = await supabase
      .from("sections")
      .select("id")
      .eq("code", updates.section_code)
      .single();
    if (!section) throw new Error(`Section ${updates.section_code} not found`);
    payload.section_id = section.id;
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", id)
    .select("*, section:sections(*)")
    .single();

  if (error) throw error;
  return data as Profile;
}

export async function deleteStudent(id: string): Promise<void> {
  const { error } = await supabase.from("profiles").delete().eq("id", id);
  if (error) throw error;
}

// ─── CSV Validation & Bulk Upload ───────────────────────────────────────────

export function validateCSVRow(
  row: Record<string, string>,
  mapping: CSVColumnMapping,
  rowIndex: number,
): CSVValidationError[] {
  const errors: CSVValidationError[] = [];

  const name = mapping.full_name ? row[mapping.full_name]?.trim() : "";
  const email = mapping.email ? row[mapping.email]?.trim() : "";
  const rollNumber = mapping.roll_number ? row[mapping.roll_number]?.trim() : "";
  const section = mapping.section ? row[mapping.section]?.trim().toUpperCase() : "";

  if (!name) {
    errors.push({ row: rowIndex, field: "full_name", message: "Name is required" });
  }
  if (!email) {
    errors.push({ row: rowIndex, field: "email", message: "Email is required" });
  } else if (!isValidEmail(email)) {
    errors.push({ row: rowIndex, field: "email", message: `Invalid email: ${email}` });
  }
  if (!rollNumber) {
    errors.push({
      row: rowIndex,
      field: "roll_number",
      message: "PG ID is required",
    });
  }
  if (!section || !SECTION_CODES.includes(section as SectionCode)) {
    errors.push({
      row: rowIndex,
      field: "section",
      message: `Invalid section "${section}". Must be A-F`,
    });
  }

  return errors;
}

export async function bulkUploadStudents(
  rows: Record<string, string>[],
  mapping: CSVColumnMapping,
): Promise<BulkUploadResult> {
  const allErrors: CSVValidationError[] = [];
  const validRows: StudentFormData[] = [];

  // Validate all rows
  for (let i = 0; i < rows.length; i++) {
    const errors = validateCSVRow(rows[i], mapping, i + 1);
    if (errors.length > 0) {
      allErrors.push(...errors);
    } else {
      validRows.push({
        full_name: rows[i][mapping.full_name!].trim(),
        email: rows[i][mapping.email!].trim().toLowerCase(),
        roll_number: rows[i][mapping.roll_number!].trim(),
        section_code: rows[i][mapping.section!].trim().toUpperCase() as SectionCode,
      });
    }
  }

  if (validRows.length === 0) {
    return { success: 0, failed: rows.length, errors: allErrors };
  }

  // Fetch section ID map
  const { data: sections } = await supabase.from("sections").select("id, code");
  const sectionMap = new Map(
    (sections ?? []).map((s: { id: string; code: string }) => [s.code, s.id]),
  );

  // Prepare upsert payload
  const records = validRows.map((r) => ({
    full_name: r.full_name,
    email: r.email,
    roll_number: r.roll_number,
    section_id: sectionMap.get(r.section_code),
    role: "student" as const,
  }));

  // Batch upsert (on conflict by email)
  const { error } = await supabase.from("profiles").upsert(records, {
    onConflict: "email",
    ignoreDuplicates: false,
  });

  if (error) {
    return {
      success: 0,
      failed: rows.length,
      errors: [...allErrors, { row: 0, field: "database", message: error.message }],
    };
  }

  return {
    success: validRows.length,
    failed: allErrors.length,
    errors: allErrors,
  };
}
