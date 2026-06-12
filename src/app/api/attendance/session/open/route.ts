import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin-request";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const context = await getAdminContext();
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const body = await request.json().catch(() => null);
  const eventId = String(body?.event_id ?? "");

  if (!eventId) {
    return NextResponse.json({ error: "event_id is required" }, { status: 400 });
  }

  const { data, error } = await context.serviceClient
    .from("attendance_sessions")
    .insert({
      event_id: eventId,
      opened_by: context.user.id,
      is_open: true,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  void context.serviceClient.from("attendance_audit_log").insert({
    session_id: data.id,
    event_id: eventId,
    action: "session_opened",
    performed_by: context.user.id,
  });

  return NextResponse.json(data);
}
