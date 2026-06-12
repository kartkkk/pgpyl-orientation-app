import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin-request";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const context = await getAdminContext();
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const body = await request.json().catch(() => null);
  const title = String(body?.title ?? "").trim();
  const alertBody = String(body?.body ?? "").trim();
  const scheduledAt = body?.scheduled_at ? String(body.scheduled_at) : null;
  const now = new Date().toISOString();

  if (!title || !alertBody) {
    return NextResponse.json({ error: "Title and body are required" }, { status: 400 });
  }

  const { data, error } = await context.serviceClient
    .from("notifications")
    .insert({
      title,
      body: alertBody,
      deep_link: body?.deep_link ? String(body.deep_link).trim() : null,
      visibility: "all",
      status: scheduledAt ? "scheduled" : "sent",
      scheduled_at: scheduledAt,
      sent_at: scheduledAt ? null : now,
      event_id: body?.event_id || null,
      created_by: context.user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
