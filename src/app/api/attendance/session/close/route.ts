import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin-request";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const context = await getAdminContext();
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const body = await request.json().catch(() => null);
  const sessionId = String(body?.session_id ?? "");

  if (!sessionId) {
    return NextResponse.json({ error: "session_id is required" }, { status: 400 });
  }

  const { data, error } = await context.serviceClient
    .from("attendance_sessions")
    .update({
      is_open: false,
      closed_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  void context.serviceClient.from("attendance_audit_log").insert({
    session_id: data.id,
    event_id: data.event_id,
    action: "session_closed",
    performed_by: context.user.id,
  });

  return NextResponse.json(data);
}
