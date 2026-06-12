import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin-request";
import { canonicalizeVenueName } from "@/modules/events/venue-metadata";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const context = await getAdminContext();
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const body = await request.json().catch(() => null);
  const title = String(body?.title ?? "").trim();
  const description = String(body?.description ?? "").trim();
  const startsAt = String(body?.starts_at ?? "");
  const endsAt = String(body?.ends_at ?? "");

  if (!title || !startsAt) {
    return NextResponse.json({ error: "Title and start time are required" }, { status: 400 });
  }

  const { data, error } = await context.serviceClient
    .from("events")
    .insert({
      title,
      description: description || null,
      venue: canonicalizeVenueName(String(body?.venue ?? "")),
      starts_at: startsAt,
      ends_at: endsAt || null,
      visibility: "all",
      created_by: context.user.id,
    })
    .select("id,title,description,venue,starts_at,ends_at,visibility,outlook_event_id,outlook_calendar_id,ical_uid,is_cancelled,created_by,created_at,updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ...data, event_assignments: [] });
}
