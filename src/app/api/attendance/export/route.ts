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
};

function csvCell(value: string | null | undefined): string {
  const text = value ?? "";
  return `"${text.replace(/"/g, '""')}"`;
}

function csvRow(values: Array<string | null | undefined>): string {
  return values.map(csvCell).join(",");
}

export async function GET(request: Request) {
  try {
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
    const profileById = new Map<string, { email: string | null; full_name: string | null }>();

    if (sessionId) {
      const { data, error } = await supabase
        .from("attendance_records")
        .select("profile_id, scanned_at")
        .eq("session_id", sessionId);

      if (error) {
        return NextResponse.json({ error: "Unable to load attendance records" }, { status: 500 });
      }

      records = (data ?? []) as AttendanceRecordRow[];

      const profileIds = [...new Set(records.map((record) => record.profile_id).filter(Boolean))];
      if (profileIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, email, full_name")
          .in("id", profileIds);

        if (profilesError) {
          return NextResponse.json({ error: "Unable to load attendance profiles" }, { status: 500 });
        }

        for (const profile of profiles ?? []) {
          profileById.set(profile.id, {
            email: profile.email,
            full_name: profile.full_name,
          });
        }
      }
    }

    const attendanceByEmail = new Map<string, string>();
    for (const record of records) {
      const profile = profileById.get(record.profile_id);
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
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to export attendance";

    return NextResponse.json(
      { error: message || "Unable to export attendance" },
      { status: 500 },
    );
  }
}
