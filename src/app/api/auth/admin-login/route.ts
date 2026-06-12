import { NextResponse } from "next/server";
import { isAdminEmail, normalizeEmail } from "@/lib/auth-rules";
import { createServiceClient } from "@/lib/supabase/admin";
import { upsertPasswordUser } from "@/lib/supabase/auth-admin";

export const dynamic = "force-dynamic";

function nameFromEmail(email: string) {
  return email
    .split("@")[0]
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function POST(request: Request) {
  const adminLoginPassword = process.env.ADMIN_LOGIN_PASSWORD;
  const body = await request.json().catch(() => null);
  const email = normalizeEmail(body?.email ?? "");
  const password = String(body?.password ?? "");

  if (!adminLoginPassword) {
    return NextResponse.json({ error: "Admin login is not configured yet." }, { status: 500 });
  }

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  if (!isAdminEmail(email) || password !== adminLoginPassword) {
    return NextResponse.json({ error: "Invalid admin login." }, { status: 401 });
  }

  try {
    const supabase = createServiceClient();
    const fullName = nameFromEmail(email);
    const user = await upsertPasswordUser({
      supabase,
      email,
      password,
      fullName,
    });

    const { error } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        email,
        full_name: fullName,
        role: "admin",
      },
      { onConflict: "id" },
    );

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unable to prepare admin login.";
    console.error("[admin-login] failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
