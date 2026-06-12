// Supabase Edge Function: on-event-change
// Triggered by a Dashboard webhook on events INSERT / UPDATE / DELETE.
//
// On INSERT:
//   Creates 3 notifications scheduled at 1 hour, 15 minutes, and 5 minutes
//   before the event starts.
//
// On UPDATE:
//   Deletes pending notifications and recreates them for the new event state.
//   Handles cancellation/un-cancellation.
//
// On DELETE:
//   Deletes any pending (draft/scheduled) notifications for the event.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface EventRecord {
    id: string;
    title: string;
    description: string | null;
    venue: string | null;
    starts_at: string;
    ends_at: string | null;
    visibility: "all" | "section" | "individual";
    is_cancelled: boolean;
    created_by: string;
}

interface WebhookPayload {
    type: "INSERT" | "UPDATE" | "DELETE";
    table: string;
    record: EventRecord | null;
    old_record: EventRecord | null;
}

interface NotificationTier {
    minutesBefore: number;
    titleSuffix: string;
    bodyWithVenue: (venue: string) => string;
    bodyWithoutVenue: string;
}

const NOTIFICATION_TIERS: NotificationTier[] = [
    // {
    //   minutesBefore: 60,
    //   titleSuffix: "in 1 hour",
    //   bodyWithVenue: (v) => `Happening at ${v} in 1 hour. Get ready!`,
    //   bodyWithoutVenue: "Happening in 1 hour. Get ready!",
    // },
    {
        minutesBefore: 15,
        titleSuffix: "in 15 minutes",
        bodyWithVenue: (v) => `Starting at ${v} in 15 minutes!`,
        bodyWithoutVenue: "Starting in 15 minutes!",
    },
    {
        minutesBefore: 5,
        titleSuffix: "starting now",
        bodyWithVenue: (v) => `About to begin at ${v}. Head over now!`,
        bodyWithoutVenue: "About to begin. Head over now!",
    },
];

Deno.serve(async (req) => {
    try {
        const payload: WebhookPayload = await req.json();
        const { type, record, old_record } = payload;

        console.log(`[on-event-change] type=${type}, table=${payload.table}`);

        if (payload.table !== "events") {
            return jsonResponse({ skipped: true, reason: "Not from events table" });
        }

        const supabase = createClient(supabaseUrl, serviceRoleKey);

        if (type === "INSERT" && record) {
            const result = await createEventNotifications(supabase, record);
            return jsonResponse({ operation: "insert", notifications: result });
        }

        if (type === "UPDATE" && record && old_record) {
            const result = await handleEventUpdate(supabase, record, old_record);
            return jsonResponse({ operation: "update", ...result });
        }

        if (type === "DELETE" && old_record) {
            const result = await deletePendingNotifications(supabase, old_record.id);
            return jsonResponse({ operation: "delete", notifications: result });
        }

        return jsonResponse({ skipped: true, reason: "Unhandled operation" });
    } catch (err) {
        console.error("[on-event-change] FATAL ERROR:", err);
        return jsonResponse({ error: String(err) }, 500);
    }
});

// ─── Notification Creation ─────────────────────────────────────────────────

async function createEventNotifications(supabase: ReturnType<typeof createClient>, event: EventRecord) {
    if (event.is_cancelled) {
        console.log("[notification] Skipping: event is cancelled");
        return { skipped: true, reason: "Event is cancelled" };
    }

    const eventStart = new Date(event.starts_at);
    const now = new Date();
    const results: { notification_id: string; scheduled_at: string; tier: string }[] = [];

    for (const tier of NOTIFICATION_TIERS) {
        const scheduledAt = new Date(eventStart.getTime() - tier.minutesBefore * 60 * 1000);

        if (scheduledAt <= now) {
            console.log(`[notification] Skipping ${tier.minutesBefore}min tier: already past`);
            continue;
        }

        const { data: notification, error: notifErr } = await supabase
            .from("notifications")
            .insert({
                title: `${event.title} - ${tier.titleSuffix}`,
                body: event.venue ? tier.bodyWithVenue(event.venue) : tier.bodyWithoutVenue,
                deep_link: `/events/${event.id}`,
                visibility: event.visibility,
                status: "scheduled",
                event_id: event.id,
                scheduled_at: scheduledAt.toISOString(),
                created_by: event.created_by,
            })
            .select()
            .single();

        if (notifErr) {
            console.error(`[notification] Failed to insert ${tier.minutesBefore}min notification:`, notifErr);
            throw notifErr;
        }

        console.log(`[notification] Created ${tier.minutesBefore}min notification ${notification.id}`);

        await copyEventAssignments(supabase, event, notification.id);

        results.push({
            notification_id: notification.id,
            scheduled_at: scheduledAt.toISOString(),
            tier: `${tier.minutesBefore}min`,
        });
    }

    console.log(`[notification] Created ${results.length} notifications for "${event.title}"`);
    return { created: results.length, notifications: results };
}

// ─── Event Update Handler ──────────────────────────────────────────────────

async function handleEventUpdate(supabase: ReturnType<typeof createClient>, event: EventRecord, oldEvent: EventRecord) {
    // Cancelled → delete pending notifications
    if (event.is_cancelled && !oldEvent.is_cancelled) {
        console.log("[notification] Event cancelled, deleting pending notifications");
        const result = await deletePendingNotifications(supabase, event.id);
        return { operation: "cancelled", ...result };
    }

    // Un-cancelled → recreate notifications
    if (!event.is_cancelled && oldEvent.is_cancelled) {
        console.log("[notification] Event un-cancelled, creating notifications");
        const result = await createEventNotifications(supabase, event);
        return { operation: "uncancelled", ...result };
    }

    // Still cancelled → nothing to do
    if (event.is_cancelled) {
        return { skipped: true, reason: "Event is still cancelled" };
    }

    // Any other change → delete pending and recreate
    console.log("[notification] Event updated, rebuilding notifications");
    const deleteResult = await deletePendingNotifications(supabase, event.id);
    const createResult = await createEventNotifications(supabase, event);
    return { operation: "updated", deleted: deleteResult, created: createResult };
}

// ─── Helpers ───────────────────────────────────────────────────────────────

async function deletePendingNotifications(supabase: ReturnType<typeof createClient>, eventId: string) {
    const { data, error } = await supabase
        .from("notifications")
        .delete()
        .eq("event_id", eventId)
        .in("status", ["draft", "scheduled"])
        .select("id");

    if (error) {
        console.error("[notification] Failed to delete pending notifications:", error);
        throw error;
    }

    const count = data?.length ?? 0;
    console.log(`[notification] Deleted ${count} pending notifications for event ${eventId}`);
    return { deleted_count: count };
}

async function copyEventAssignments(
    supabase: ReturnType<typeof createClient>,
    event: EventRecord,
    notificationId: string,
) {
    if (event.visibility === "all") return;

    const { data: eventAssignments } = await supabase
        .from("event_assignments")
        .select("section_id, profile_id")
        .eq("event_id", event.id);

    if (!eventAssignments?.length) return;

    const notifAssignments = eventAssignments.map((a: { section_id: string | null; profile_id: string | null }) => ({
        notification_id: notificationId,
        section_id: a.section_id,
        profile_id: a.profile_id,
    }));

    const { error } = await supabase.from("notification_assignments").insert(notifAssignments);

    if (error) {
        console.error(`[notification] Failed to copy assignments for ${notificationId}:`, error);
    }
}

function jsonResponse(data: Record<string, unknown>, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json" },
    });
}
