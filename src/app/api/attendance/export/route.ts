import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type AllowedStudentRow = {
  email: string;
  full_name: string;
  first_name: string | null;
  last_name: string | null;
};

type AttendanceRecordRow = {
  profile_id: string;
  scanned_at: string;
  profile: { email: string | null; full_name: string | null } | { email: string | null; full_name: string | null }[] | null;
};

function csvCell(value: string | null | undefined): string {
  const text = value ?? "";
  return `"${text.replace(/"/g, '""')}"`;
}

function csvRow(values: Array<string | null | undefined>): string {
  return values.map(csvCell).join(",");
}

function profileFromRecord(record: AttendanceRecordRow): { email: string | null; full_name: string | null } | null {
  if (Array.isArray(record.profile)) return record.profile[0] ?? null;
  return record.profile;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const eventId = url.searchParams.get("event_id");

  if (!eventId) {
    return NextResponse.json({ error: "event_id is required" }, { status: 400 });
  }

  const supabaseAuth = await createServerSupabase();
  const {
    data: { user },
    error: authError,
  } = await supabaseAuth.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (adminProfile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [{ data: event, error: eventError }, { data: sessions, error: sessionError }, { data: students, error: studentsError }] =
    await Promise.all([
      supabase.from("events").select("title, starts_at").eq("id", eventId).single(),
      supabase
        .from("attendance_sessions")
        .select("id")
        .eq("event_id", eventId)
        .order("opened_at", { ascending: false })
        .limit(1),
      supabase
        .from("allowed_students")
        .select("email, full_name, first_name, last_name")
        .order("full_name", { ascending: true }),
    ]);

  if (eventError || !event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  if (sessionError) {
    return NextResponse.json({ error: "Unable to load attendance session" }, { status: 500 });
  }

  if (studentsError) {
    return NextResponse.json({ error: "Unable to load student list" }, { status: 500 });
  }

  const sessionId = sessions?.[0]?.id;
  let records: AttendanceRecordRow[] = [];

  if (sessionId) {
    const { data, error } = await supabase
      .from("attendance_records")
      .select("profile_id, scanned_at, profile:profiles(email, full_name)")
      .eq("session_id", sessionId);

    if (error) {
      return NextResponse.json({ error: "Unable to load attendance records" }, { status: 500 });
    }

    records = (data ?? []) as AttendanceRecordRow[];
  }

  const attendanceByEmail = new Map<string, string>();
  for (const record of records) {
    const profile = profileFromRecord(record);
    const email = profile?.email?.toLowerCase();
    if (email && !attendanceByEmail.has(email)) {
      attendanceByEmail.set(email, record.scanned_at);
    }
  }

  const header = csvRow(["Full Name", "First Name", "Last Name", "Email", "Status", "Scanned At"]);
  const rows = ((students ?? []) as AllowedStudentRow[]).map((student) => {
    const email = student.email.toLowerCase();
    const scannedAt = attendanceByEmail.get(email);
    return csvRow([
      student.full_name,
      student.first_name,
      student.last_name,
      email,
      scannedAt ? "Present" : "Absent",
      scannedAt ? new Date(scannedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "",
    ]);
  });

  const csv = [header, ...rows].join("\n");
  const safeTitle = String(event.title ?? "event").replace(/[^a-zA-Z0-9-_ ]/g, "").trim() || "event";
  const dateStr = new Date(event.starts_at).toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="attendance-${safeTitle}-${dateStr}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
