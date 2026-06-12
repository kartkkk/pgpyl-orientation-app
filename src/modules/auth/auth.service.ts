import { supabase } from "@/lib/supabase";
import type { UserRole } from "@/types";

/**
 * Auth email rules.
 * - Admins are explicit personal emails.
 * - Students are the PGP YL 2028 cohort emails.
 */
const DEFAULT_ADMIN_EMAILS = [
  "karthik_m@isb.edu",
  "aziz_abdul@isb.edu",
  "anitha_pothini@isb.edu",
  "saniya_arora@isb.edu",
  "tvs_pradeep@isb.edu",
];

const COHORT_EMAIL_PATTERN =
  process.env.NEXT_PUBLIC_COHORT_EMAIL_PATTERN || "_pgpyl2028@isb\\.edu$";
const ADMIN_EMAILS = (
  process.env.NEXT_PUBLIC_ADMIN_EMAILS || DEFAULT_ADMIN_EMAILS.join(",")
)
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const cohortRegex = new RegExp(COHORT_EMAIL_PATTERN, "i");

export function isAdminEmail(email: string): boolean {
  const normalizedEmail = email.trim().toLowerCase();
  return ADMIN_EMAILS.includes(normalizedEmail);
}

export function isCohortEmail(email: string): boolean {
  return cohortRegex.test(email.trim().toLowerCase());
}

export function determineRole(email: string): UserRole {
  return isAdminEmail(email) ? "admin" : "student";
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
