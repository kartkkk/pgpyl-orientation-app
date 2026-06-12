import { supabase } from "@/lib/supabase";
import { isAdminEmail } from "@/lib/auth-rules";
import type { UserRole } from "@/types";

export function determineRole(email: string): UserRole {
  return isAdminEmail(email) ? "admin" : "student";
}

/**
 * Ensure a profile exists for the authenticated user.
 * If the profile doesn't exist yet, create one with the appropriate role.
 */
export async function ensureProfile(
  userId: string,
  email: string,
  fullName: string,
) {
  const normalizedEmail = email.toLowerCase();
  const role = determineRole(normalizedEmail);

  const { data: existing } = await supabase
    .from("profiles")
    .select("*, section:sections(*)")
    .eq("id", userId)
    .single();

  if (existing) return existing;

  const { data: created, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: userId,
        email: normalizedEmail,
        full_name: fullName || normalizedEmail.split("@")[0],
        role,
      },
      { onConflict: "id", ignoreDuplicates: true },
    )
    .select("*, section:sections(*)")
    .single();

  if (error) {
    const { data: retried } = await supabase
      .from("profiles")
      .select("*, section:sections(*)")
      .eq("id", userId)
      .single();
    if (retried) return retried;
    throw new Error(`Failed to create profile: ${error.message}`);
  }

  return created;
}
