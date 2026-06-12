import { randomInt } from "crypto";
import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";

const CODE_TTL_MS = 90_000;
const MAX_CODE_ATTEMPTS = 5;

function createCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionId = body?.session_id;
  if (!sessionId || typeof sessionId !== "string") {
    return NextResponse.json({ error: "session_id is required" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const [{ data: profile }, { data: session, error: sessionError }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).single(),
    supabase
      .from("attendance_sessions")
      .select("id, is_open")
      .eq("id", sessionId)
      .single(),
  ]);

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (sessionError || !session?.is_open) {
    return NextResponse.json({ error: "Attendance session is not open" }, { status: 400 });
  }

  const now = new Date();
  const validUntil = new Date(now.getTime() + CODE_TTL_MS);
  let code = createCode();
  let inserted: { token: string; valid_until: string } | null = null;
  let lastError: { code?: string; message: string } | null = null;

  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
    code = createCode();
    const { data, error } = await supabase
      .from("qr_tokens")
      .insert({
        session_id: sessionId,
        token: code,
        valid_from: now.toISOString(),
        valid_until: validUntil.toISOString(),
      })
      .select("token, valid_until")
      .single();

    if (!error && data) {
      inserted = data as { token: string; valid_until: string };
      break;
    }

    lastError = error;
    if (error?.code !== "23505") break;
  }

  if (!inserted) {
    return NextResponse.json(
      { error: lastError?.message || "Could not create attendance code" },
      { status: 500 },
    );
  }

  const { data: oldTokens } = await supabase
    .from("qr_tokens")
    .select("id")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .range(4, 1000);

  if (oldTokens?.length) {
    await supabase
      .from("qr_tokens")
      .delete()
      .in("id", oldTokens.map((row: { id: string }) => row.id));
  }

  return NextResponse.json({
    token: inserted.token,
    code: inserted.token,
    valid_until: inserted.valid_until,
  });
}
