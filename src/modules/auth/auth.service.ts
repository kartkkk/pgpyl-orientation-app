import { supabase } from "@/lib/supabase";
import type { UserRole } from "@/types";

/**
 * Determine user role based on email pattern.
 * Admin pattern is configurable via NEXT_PUBLIC_ADMIN_EMAIL_PATTERN.
 */
const ADMIN_EMAIL_PATTERN =
  process.env.NEXT_PUBLIC_ADMIN_EMAIL_PATTERN || "_pgp\\d{4}@isb\\.edu$";
const adminRegex = new RegExp(ADMIN_EMAIL_PATTERN, "i");

export function determineRole(email: string): UserRole {
  return adminRegex.test(email.toLowerCase()) ? "admin" : "student";
}

/**
 * Start Microsoft OAuth flow via Supabase Azure provider.
 * On web this triggers a full-page redirect — no popup.
 */
export async function signInWithMicrosoft() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "azure",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      scopes: "email profile openid",
      queryParams: {
        domain_hint: "isb.edu",
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Start passwordless email sign-in via Supabase magic link.
 * This is the simplest setup: enable the Email provider in Supabase.
 */
export async function signInWithEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  const { error } = await supabase.auth.signInWithOtp({
    email: normalizedEmail,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    throw new Error(error.message);
  }
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
