import { NextResponse } from "next/server";
import {
    getServiceSupabase,
    ensureFirebaseAdmin,
    resolveRecipients,
    sendNotificationViaFCM,
} from "@/lib/notifications/send-fcm";
import { isOneSignalConfigured, sendNotificationViaOneSignal } from "@/lib/notifications/send-onesignal";

export const dynamic = "force-dynamic";
export const maxDuration = 30; // Vercel function timeout (seconds)

const LOG_PREFIX = "[cron/send-notifications]";

/**
 * GET /api/cron/send-notifications
 *
 * Cron handler — picks up scheduled notifications whose scheduled_at
 * has passed, plus stuck "sending" notifications older than 2 minutes.
 *
 * Auth:
 *   • Authorization: Bearer <CRON_SECRET>  (Vercel Cron)
 *   • x-cron-secret: <CRON_SECRET>         (Supabase pg_cron)
 */
export async function GET(request: Request) {
    const t0 = Date.now();

    // ── Auth ────────────────────────────────────────────────────────────
    const secret = process.env.CRON_SECRET;
    const authHeader = request.headers.get("authorization");
    const cronHeader = request.headers.get("x-cron-secret");
    const authorized = !!secret && (authHeader === `Bearer ${secret}` || cronHeader === secret);

    if (!authorized) {
        console.warn(`${LOG_PREFIX} Unauthorized request — auth=${!!authHeader} cron=${!!cronHeader} secret-set=${!!secret}`);
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const supabase = getServiceSupabase();
        const now = new Date().toISOString();
        const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();

        // Fetch scheduled + stuck notifications in parallel
        const [scheduledResult, stuckResult] = await Promise.all([
            supabase
                .from("notifications")
                .select("*")
                .eq("status", "scheduled")
                .lte("scheduled_at", now)
                .limit(10),
            supabase
                .from("notifications")
                .select("*")
                .eq("status", "sending")
                .lte("updated_at", twoMinAgo)
                .limit(10),
        ]);

        if (scheduledResult.error) {
            console.error(`${LOG_PREFIX} DB query failed:`, scheduledResult.error.message);
            throw scheduledResult.error;
        }
        if (stuckResult.error) {
            console.warn(`${LOG_PREFIX} Stuck query failed (non-fatal):`, stuckResult.error.message);
        }

        const scheduled = scheduledResult.data ?? [];
        const stuck = stuckResult.data ?? [];
        const notifications = [...scheduled, ...stuck];

        console.info(
            `${LOG_PREFIX} Tick: scheduled=${scheduled.length} stuck=${stuck.length} total=${notifications.length}`,
        );

        if (!notifications.length) {
            return NextResponse.json({ message: "No pending notifications", took_ms: Date.now() - t0 });
        }

        // Lock notifications as "sending" in batched updates grouped by
        // current status. The status predicate prevents duplicate sends from
        // overlapping cron ticks (a row already claimed will have status
        // "sending" and won't match the WHERE clause).
        const scheduledIds = scheduled.map((n) => n.id);
        const stuckIds = stuck.map((n) => n.id);

        const [scheduledLock, stuckLock] = await Promise.all([
            scheduledIds.length > 0
                ? supabase
                      .from("notifications")
                      .update({ status: "sending" })
                      .in("id", scheduledIds)
                      .eq("status", "scheduled")
                      .select("id")
                : Promise.resolve({ data: [] as { id: string }[], error: null }),
            stuckIds.length > 0
                ? supabase
                      .from("notifications")
                      .update({ status: "sending" })
                      .in("id", stuckIds)
                      .eq("status", "sending")
                      .lte("updated_at", twoMinAgo)
                      .select("id")
                : Promise.resolve({ data: [] as { id: string }[], error: null }),
        ]);

        if (scheduledLock.error) {
            console.error(`${LOG_PREFIX} Scheduled lock failed:`, scheduledLock.error.message);
        }
        if (stuckLock.error) {
            console.error(`${LOG_PREFIX} Stuck lock failed:`, stuckLock.error.message);
        }

        const lockedIds = new Set([
            ...(scheduledLock.data ?? []).map((r) => r.id),
            ...(stuckLock.data ?? []).map((r) => r.id),
        ]);

        const locked = notifications
            .filter((n) => lockedIds.has(n.id))
            .map((notif) => ({ notif, locked: true }));
        const lockFailed = notifications
            .filter((n) => !lockedIds.has(n.id))
            .map((notif) => ({ notif, locked: false }));

        for (const { notif } of lockFailed) {
            console.error(`${LOG_PREFIX} Failed to lock: notif=${notif.id}`);
        }

        // Process all locked notifications in parallel
        const settled = await Promise.all(
            locked.map(async ({ notif }) => {
                const tNotif = Date.now();

                if (isOneSignalConfigured()) {
                    const recipients = await resolveRecipients(supabase, notif);
                    const oneSignalSubscriptionIds = recipients
                        .map((recipient) => recipient.fcm_token)
                        .filter((token) => token.startsWith("onesignal:"))
                        .map((token) => token.replace("onesignal:", ""));

                    const result = await sendNotificationViaOneSignal(notif, oneSignalSubscriptionIds);
                    const finalStatus = result.sent_count > 0 ? "sent" : "failed";

                    await supabase
                        .from("notifications")
                        .update({ status: finalStatus, sent_at: new Date().toISOString() })
                        .eq("id", notif.id);

                    console.info(
                        `${LOG_PREFIX} Sent via OneSignal: notif=${notif.id} status=${finalStatus} ` +
                            `sent=${result.sent_count} took=${Date.now() - tNotif}ms`,
                    );

                    return { id: notif.id, status: finalStatus, sent: result.sent_count, failed: 0 };
                }

                ensureFirebaseAdmin();
                const recipients = await resolveRecipients(supabase, notif);

                if (recipients.length === 0) {
                    await supabase
                        .from("notifications")
                        .update({ status: "failed", sent_at: new Date().toISOString() })
                        .eq("id", notif.id);
                    console.warn(`${LOG_PREFIX} No recipients: notif=${notif.id} visibility=${notif.visibility}`);
                    return { id: notif.id, status: "failed", sent: 0, failed: 0 };
                }

                const result = await sendNotificationViaFCM(supabase, notif, recipients);
                const finalStatus = result.sent_count > 0 ? "sent" : "failed";

                await supabase
                    .from("notifications")
                    .update({ status: finalStatus, sent_at: new Date().toISOString() })
                    .eq("id", notif.id);

                console.info(
                    `${LOG_PREFIX} Sent: notif=${notif.id} status=${finalStatus} ` +
                        `sent=${result.sent_count} failed=${result.failed_count} ` +
                        `recipients=${recipients.length} took=${Date.now() - tNotif}ms`,
                );

                return { id: notif.id, status: finalStatus, sent: result.sent_count, failed: result.failed_count };
            }),
        );

        const results = [
            ...lockFailed.map(({ notif }) => ({ id: notif.id, status: "lock_failed", sent: 0, failed: 0 })),
            ...settled,
        ];
        let totalSent = 0;
        let totalFailed = 0;
        for (const r of settled) {
            totalSent += r.sent;
            totalFailed += r.failed;
        }

        console.info(
            `${LOG_PREFIX} Complete: processed=${notifications.length} sent=${totalSent} failed=${totalFailed} total=${Date.now() - t0}ms`,
        );

        return NextResponse.json({
            processed: notifications.length,
            total_sent: totalSent,
            total_failed: totalFailed,
            results,
            took_ms: Date.now() - t0,
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`${LOG_PREFIX} Unhandled error (${Date.now() - t0}ms):`, err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
