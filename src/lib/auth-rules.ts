export const DEFAULT_ADMIN_EMAILS = [
  "karthik_m@isb.edu",
  "aziz_abdul@isb.edu",
  "anitha_pothini@isb.edu",
  "saniya_arora@isb.edu",
  "tvs_pradeep@isb.edu",
];

const ADMIN_EMAILS = (
  process.env.NEXT_PUBLIC_ADMIN_EMAILS || DEFAULT_ADMIN_EMAILS.join(",")
)
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(normalizeEmail(email));
}
