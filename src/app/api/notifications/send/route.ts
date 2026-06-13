import { NextResponse, after } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import {
    getServiceSupabase,
    ensureFirebaseAdmin,
    resolveRecipients,
    sendNotificationViaFCM,
} from "@/lib/notifications/send-fcm";

export const dynamic = "force-dynamic";
export const maxDuration = 30; // Vercel function timeout (seconds)

const LOG_PREFIX = "[notifications/send]";

/**
 * POST /api/notifications/send
 *
 * Immediately sends a notification that has already been created in the DB.
 * Skips the cron wait — used for "Send Now" from the admin alerts form.
 *
 * Auth: Validates the caller's Supabase session cookie and checks admin role.
 * Body: { notification_id: string }
 */
export async function POST(request: Request) {
    const t0 = Date.now();

    try {
        // 1. Authenticate + parse body in parallel (independent operations)
        const [supabaseAuth, body] = await Promise.all([
            createServerSupabase(),
            request.json().catch(() => null),
        ]);

        const {
            data: { user },
            error: authErr,
        } = await supabaseAuth.auth.getUser();

        if (authErr || !user) {
            console.warn(`${LOG_PREFIX} Unauthorized: authErr=${authErr?.message ?? "no session"}`);
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Validate body early (cheap, no await)
        const notificationId = body?.notification_id;

        if (!notificationId || typeof notificationId !== "string") {
            return NextResponse.json({ error: "notification_id is required" }, { status: 400 });
        }

        // 3. Initialise the Supabase service client. Firebase is optional:
        // when it is not configured, we still publish the alert in-app.
        const supabase = getServiceSupabase();

        // 4. Verify admin role + fetch notification in parallel (independent queries)
        const [{ data: callerProfile }, { data: notif, error: fetchErr }] = await Promise.all([
            supabaseAuth.from("profiles").select("role").eq("id", user.id).single(),
            supabase.from("notifications").select("*").eq("id", notificationId).single(),
        ]);

        if (callerProfile?.role !== "admin") {
            console.warn(`${LOG_PREFIX} Forbidden: user=${user.id} role=${callerProfile?.role}`);
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        console.info(`${LOG_PREFIX} Send requested: notif=${notificationId} by=${user.id}`);

        if (fetchErr || !notif) {
            console.warn(`${LOG_PREFIX} Not found: notif=${notificationId} err=${fetchErr?.message}`);
            return NextResponse.json({ error: "Notification not found" }, { status: 404 });
        }

        if (notif.status !== "scheduled") {
            console.warn(`${LOG_PREFIX} Wrong status: notif=${notificationId} status=${notif.status}`);
            return NextResponse.json(
                { error: `Cannot send notification with status "${notif.status}"` },
                { status: 409 },
            );
        }

        // 6. Mark as sending (acts as a lock to prevent duplicate sends)
        const { error: lockErr } = await supabase.from("notifications").update({ status: "sending" }).eq("id", notif.id);
        if (lockErr) {
            console.error(`${LOG_PREFIX} Failed to lock: notif=${notif.id} err=${lockErr.message}`);
            return NextResponse.json({ error: "Failed to lock notification" }, { status: 500 });
        }

        // 7. Resolve recipients, send via FCM, and update status — all deferred
        //    so the client gets an instant response. The cron job rescues any
        //    notifications stuck in "sending" for >2 min as a safety net.
        after(async () => {
            try {
                const tResolve = Date.now();
                const recipients = await resolveRecipients(supabase, notif);
                console.info(
                    `${LOG_PREFIX} Recipients resolved: notif=${notif.id} count=${recipients.length} took=${Date.now() - tResolve}ms`,
                );

                if (recipients.length === 0) {
                    await supabase
                        .from("notifications")
                        .update({ status: "sent", sent_at: new Date().toISOString() })
                        .eq("id", notif.id);
                    console.warn(`${LOG_PREFIX} No FCM tokens; published in-app only: notif=${notif.id}`);
                    return;
                }

                try {
                    ensureFirebaseAdmin();
                } catch (firebaseErr) {
                    await supabase
                        .from("notifications")
                        .update({ status: "sent", sent_at: new Date().toISOString() })
                        .eq("id", notif.id);
                    console.warn(
                        `${LOG_PREFIX} Firebase unavailable; published in-app only: notif=${notif.id}`,
                        firebaseErr,
                    );
                    return;
                }

                const tSend = Date.now();
                const result = await sendNotificationViaFCM(supabase, notif, recipients);
                const sendMs = Date.now() - tSend;
                const finalStatus = result.sent_count > 0 ? "sent" : "failed";

                const { error: updateErr } = await supabase
                    .from("notifications")
                    .update({ status: finalStatus, sent_at: new Date().toISOString() })
                    .eq("id", notif.id);

                if (updateErr) {
                    console.error(
                        `${LOG_PREFIX} Status update failed: notif=${notif.id} status=${finalStatus} err=${updateErr.message}`,
                    );
                }

                console.info(
                    `${LOG_PREFIX} Complete: notif=${notif.id} status=${finalStatus} ` +
                        `sent=${result.sent_count} failed=${result.failed_count} ` +
                        `fcm=${sendMs}ms total=${Date.now() - t0}ms`,
                );
            } catch (afterErr) {
                console.error(`${LOG_PREFIX} after() failed: notif=${notif.id}`, afterErr);
                await supabase
                    .from("notifications")
                    .update({ status: "failed", sent_at: new Date().toISOString() })
                    .eq("id", notif.id)
                    .then(({ error }) => {
                        if (error) console.error(`${LOG_PREFIX} Fallback status update also failed:`, error.message);
                    });
            }
        });

        return NextResponse.json({ status: "sending" });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`${LOG_PREFIX} Unhandled error (${Date.now() - t0}ms):`, err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
