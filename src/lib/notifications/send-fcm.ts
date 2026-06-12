/**
 * Server-only utility for resolving notification recipients and sending via
 * Firebase Cloud Messaging. Used by both the Vercel cron handler (scheduled
 * notifications) and the direct-send API route (immediate notifications).
 *
 * IMPORTANT: This file must only be imported in server contexts (API routes,
 * server actions). It uses the Supabase service-role key and Firebase Admin SDK.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

const BATCH_SIZE = 500; // FCM sendEachForMulticast limit

const STALE_TOKEN_CODES = [
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
  "messaging/invalid-argument",
];

// ── Singletons ─────────────────────────────────────────────────────────────

let _supabase: SupabaseClient | null = null;

export function getServiceSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Missing SUPABASE_URL or SERVICE_ROLE_KEY");
    _supabase = createClient(url, key);
  }
  return _supabase;
}

export function ensureFirebaseAdmin(): void {
  if (getApps().length === 0) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim();
    if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY not set");

    // Support both raw JSON and base64-encoded JSON.
    // Strip surrounding quotes that Vercel UI or shell quoting may add.
    const stripped = raw.replace(/^["']|["']$/g, "");
    let parsed: Record<string, unknown>;

    try {
      parsed = JSON.parse(stripped);
    } catch {
      try {
        parsed = JSON.parse(Buffer.from(stripped, "base64").toString("utf-8"));
      } catch (e) {
        throw new Error(
          `FIREBASE_SERVICE_ACCOUNT_KEY is neither valid JSON nor valid base64-encoded JSON. ` +
          `Value starts with: "${stripped.slice(0, 12)}…"`,
        );
      }
    }

    initializeApp({ credential: cert(parsed as Parameters<typeof cert>[0]) });
  }
}

// ── Types ──────────────────────────────────────────────────────────────────

interface ProfileWithToken {
  id: string;
  fcm_token: string;
}

interface NotificationRow {
  id: string;
  title: string;
  body: string;
  deep_link: string | null;
  visibility: "all" | "section" | "individual";
}

export interface SendResult {
  notification_id: string;
  sent_count: number;
  failed_count: number;
}

// ── Core: resolve recipients ───────────────────────────────────────────────

export async function resolveRecipients(
  supabase: SupabaseClient,
  notif: NotificationRow,
): Promise<ProfileWithToken[]> {
  if (notif.visibility === "all") {
    const { data } = await supabase
      .from("profiles")
      .select("id, fcm_token")
      .eq("is_active", true)
      .not("fcm_token", "is", null);
    return (data ?? []) as ProfileWithToken[];
  }

  if (notif.visibility === "section") {
    const { data: assignments } = await supabase
      .from("notification_assignments")
      .select("section_id")
      .eq("notification_id", notif.id)
      .not("section_id", "is", null);

    if (!assignments?.length) return [];

    const sectionIds = assignments.map((a: { section_id: string }) => a.section_id);
    const { data } = await supabase
      .from("profiles")
      .select("id, fcm_token")
      .in("section_id", sectionIds)
      .eq("role", "student")
      .eq("is_active", true)
      .not("fcm_token", "is", null);
    return (data ?? []) as ProfileWithToken[];
  }

  if (notif.visibility === "individual") {
    const { data: assignments } = await supabase
      .from("notification_assignments")
      .select("profile_id")
      .eq("notification_id", notif.id)
      .not("profile_id", "is", null);

    if (!assignments?.length) return [];

    const profileIds = assignments.map((a: { profile_id: string }) => a.profile_id);
    const { data } = await supabase
      .from("profiles")
      .select("id, fcm_token")
      .in("id", profileIds)
      .eq("is_active", true)
      .not("fcm_token", "is", null);
    return (data ?? []) as ProfileWithToken[];
  }

  return [];
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Only allow relative paths or https:// URLs in deep links. */
function sanitizeDeepLink(link: string | null): string | null {
  if (!link) return null;
  if (link.startsWith("/")) return link.replace(/^\/\([^)]+\)/, "");
  if (link.startsWith("https://")) return link;
  return null; // Reject javascript:, http://, data:, etc.
}

// ── Core: send via FCM + record deliveries + cleanup stale tokens ──────────

export async function sendNotificationViaFCM(
  supabase: SupabaseClient,
  notif: NotificationRow,
  recipients: ProfileWithToken[],
): Promise<SendResult> {
  const messaging = getMessaging();
  const safeLink = sanitizeDeepLink(notif.deep_link);
  let sentCount = 0;
  let failedCount = 0;

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE);
    const tokens = batch.map((r) => r.fcm_token);

    console.info(
      `[FCM] Sending batch: notif=${notif.id} tokens=${tokens.length} ` +
      `firstToken=${tokens[0]?.slice(0, 20)}…`,
    );

    const response = await messaging.sendEachForMulticast({
      tokens,
      data: {
        title: notif.title,
        body: notif.body,
        ...(safeLink ? { url: safeLink } : {}),
      },
      webpush: {
        fcmOptions: { link: safeLink || "/events" },
      },
    });

    console.info(
      `[FCM] Batch result: notif=${notif.id} success=${response.successCount} failure=${response.failureCount}`,
    );

    // Delivery records + stale token collection
    const staleProfileIds: string[] = [];
    const deliveries = batch.map((r, idx) => {
      const res = response.responses[idx];

      if (!res.success) {
        console.warn(
          `[FCM] Failed for profile=${r.id}: code=${res.error?.code} msg=${res.error?.message}`,
        );
      }

      if (!res.success && res.error?.code && STALE_TOKEN_CODES.includes(res.error.code)) {
        staleProfileIds.push(r.id);
      }

      return {
        notification_id: notif.id,
        profile_id: r.id,
        push_token: r.fcm_token,
        delivered_at: res.success ? new Date().toISOString() : null,
        error_message: res.error?.message ?? null,
      };
    });

    sentCount += response.successCount;
    failedCount += response.failureCount;

    // Fire-and-forget: delivery records and stale token cleanup don't need
    // to block the next FCM batch. Errors are logged but non-fatal.
    void (async () => {
      const { error: deliveryErr } = await supabase
        .from("notification_deliveries")
        .upsert(deliveries, { onConflict: "notification_id,profile_id" });

      if (deliveryErr) {
        console.warn(`[FCM] Delivery upsert failed (non-fatal): ${deliveryErr.message}`);
      }

      if (staleProfileIds.length > 0) {
        await supabase
          .from("profiles")
          .update({ fcm_token: null })
          .in("id", staleProfileIds);
      }
    })();
  }

  return { notification_id: notif.id, sent_count: sentCount, failed_count: failedCount };
}
