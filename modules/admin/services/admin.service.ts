import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types";
import type { AdminInfo } from "../types";

export async function fetchAdmins(): Promise<AdminInfo[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, promoted_by, promoted_at, promoter:profiles!promoted_by(full_name)")
    .eq("role", "admin")
    .order("promoted_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as AdminInfo[];
}

export async function fetchPromotableStudents(
  search?: string,
): Promise<Profile[]> {
  let query = supabase
    .from("profiles")
    .select("*")
    .eq("role", "student")
    .eq("is_active", true)
    .order("full_name", { ascending: true });

  if (search) {
    query = query.or(
      `full_name.ilike.%${search}%,email.ilike.%${search}%`,
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function promoteToAdmin(profileId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({
      role: "admin",
      section_id: null,
      promoted_by: userId,
      promoted_at: new Date().toISOString(),
    })
    .eq("id", profileId);

  if (error) throw error;
}

export async function demoteToStudent(
  profileId: string,
  sectionId: string,
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({
      role: "student",
      section_id: sectionId,
      promoted_by: null,
      promoted_at: null,
    })
    .eq("id", profileId);

  if (error) throw error;
}
