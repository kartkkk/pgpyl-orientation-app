import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";

const GRACE_PERIOD_MS = 30_000;

type AttendanceSessionRow = {
  id: string;
  is_open: boolean;
  event: { title: string } | { title: string }[] | null;
};

function getEventTitle(session: AttendanceSessionRow | null): string | null {
  const event = session?.event;
  if (!event) return null;
  return Array.isArray(event) ? event[0]?.title ?? null : event.title;
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

  const value = String(body?.token ?? "").trim();
  if (!value) {
    return NextResponse.json({ error: "Attendance code is required" }, { status: 400 });
  }

  const isManualCode = /^\d{6}$/.test(value);
  if (!isManualCode && !/^[a-f0-9]{64}$/i.test(value)) {
    return NextResponse.json({ error: "Invalid attendance code" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: qrToken, error: tokenError } = await supabase
    .from("qr_tokens")
    .select("id, session_id, valid_until")
    .eq("token", value)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (tokenError || !qrToken) {
    return NextResponse.json({ error: "Invalid attendance code" }, { status: 400 });
  }

  if (new Date(qrToken.valid_until).getTime() + GRACE_PERIOD_MS < Date.now()) {
    return NextResponse.json({ error: "Attendance code has expired" }, { status: 400 });
  }

  const { data: sessionRaw, error: sessionError } = await supabase
    .from("attendance_sessions")
    .select("id, is_open, event:events(title)")
    .eq("id", qrToken.session_id)
    .single();
  const session = sessionRaw as AttendanceSessionRow | null;

  if (sessionError || !session?.is_open) {
    return NextResponse.json({ error: "Attendance session is closed" }, { status: 400 });
  }

  const { error: insertError } = await supabase.from("attendance_records").insert({
    session_id: qrToken.session_id,
    profile_id: user.id,
    qr_token_id: qrToken.id,
    scanned_at: new Date().toISOString(),
    is_manual: isManualCode,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json({
        message: "Attendance already recorded",
        event_title: getEventTitle(session),
        already_recorded: true,
      });
    }

    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({
    message: "Attendance recorded successfully",
    event_title: getEventTitle(session),
  });
}
