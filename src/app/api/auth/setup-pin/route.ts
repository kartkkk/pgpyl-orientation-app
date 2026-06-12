import { NextResponse } from "next/server";
import { normalizeEmail } from "@/lib/auth-rules";
import { createServiceClient } from "@/lib/supabase/admin";
import { upsertPasswordUser } from "@/lib/supabase/auth-admin";

export const dynamic = "force-dynamic";

const PIN_REGEX = /^\d{6}$/;

export async function POST(request: Request) {
  const studentTempPasscode = process.env.STUDENT_TEMP_PASSCODE;
  const body = await request.json().catch(() => null);
  const email = normalizeEmail(body?.email ?? "");
  const passcode = String(body?.passcode ?? "");
  const pin = String(body?.pin ?? "");

  if (!studentTempPasscode) {
    return NextResponse.json({ error: "Student login is not configured yet." }, { status: 500 });
  }

  if (!email || !passcode || !pin) {
    return NextResponse.json({ error: "Email, passcode and PIN are required." }, { status: 400 });
  }

  if (passcode !== studentTempPasscode) {
    return NextResponse.json({ error: "Incorrect temporary passcode." }, { status: 401 });
  }

  if (!PIN_REGEX.test(pin)) {
    return NextResponse.json({ error: "PIN must be exactly 6 digits." }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: student, error: studentError } = await supabase
    .from("allowed_students")
    .select("email, full_name, pin_set_at")
    .eq("email", email)
    .maybeSingle();

  if (studentError) {
    console.error("[setup-pin] student lookup failed:", studentError.message);
    return NextResponse.json({ error: "Unable to check student list." }, { status: 500 });
  }

  if (!student) {
    return NextResponse.json({ error: "Email is not on the approved student list." }, { status: 403 });
  }

  if (student.pin_set_at) {
    return NextResponse.json({ error: "PIN already created. Use your PIN to sign in." }, { status: 409 });
  }

  try {
    const fullName = student.full_name || email.split("@")[0];
    const user = await upsertPasswordUser({
      supabase,
      email,
      password: pin,
      fullName,
    });

    const [{ error: profileError }, { error: studentUpdateError }] = await Promise.all([
      supabase.from("profiles").upsert(
        {
          id: user.id,
          email,
          full_name: fullName,
          role: "student",
        },
        { onConflict: "id" },
      ),
      supabase
        .from("allowed_students")
        .update({ pin_set_at: new Date().toISOString(), last_login_at: new Date().toISOString() })
        .eq("email", email),
    ]);

    if (profileError) throw profileError;
    if (studentUpdateError) throw studentUpdateError;

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unable to create PIN.";
    console.error("[setup-pin] failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
