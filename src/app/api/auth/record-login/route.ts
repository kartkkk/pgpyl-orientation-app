import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { normalizeEmail } from "@/lib/auth-rules";
import { createServiceClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST() {
  const supabaseAuth = await createServerSupabase();
  const {
    data: { user },
    error: authError,
  } = await supabaseAuth.auth.getUser();

  if (authError || !user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("allowed_students")
    .update({ last_login_at: new Date().toISOString() })
    .eq("email", normalizeEmail(user.email));

  if (error) {
    console.error("[record-login] failed:", error.message);
  }

  return NextResponse.json({ ok: true });
}
