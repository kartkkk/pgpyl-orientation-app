import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const [supabaseAuth, body] = await Promise.all([
    createServerSupabase(),
    request.json().catch(() => null),
  ]);

  const {
    data: { user },
    error: authError,
  } = await supabaseAuth.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Please sign in again before enabling notifications." }, { status: 401 });
  }

  const token = typeof body?.token === "string" ? body.token.trim() : "";

  if (!token || token.length < 20) {
    return NextResponse.json({ error: "Notification token was not created by this device." }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("profiles")
    .update({ fcm_token: token })
    .eq("id", user.id);

  if (error) {
    console.error("[notifications/register-device] failed:", error.message);
    return NextResponse.json({ error: "Could not save this device for notifications." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
