"use client";

import { useEffect, useRef, useCallback } from "react";
import { getFirebaseMessaging, onMessage } from "@/lib/firebase";
import { saveFCMTokenIfChanged } from "@/modules/notifications/services/notifications.service";
import { useAuth } from "@/modules/auth/auth-context";

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

/** Minimum interval between syncToken calls once a device token already exists. */
const SYNC_THROTTLE_MS = 5 * 60 * 1000;

/**
 * Requests the FCM token, saves it to Supabase if changed, and listens for
 * foreground messages. Re-checks the token on visibility change, throttled to
 * at most once every 5 minutes to avoid blocking navigation with heavy async
 * chains (Firebase init → SW ready → dynamic import → getToken → DB write).
 */
export function useFCMSetup() {
    const { profile, refreshProfile } = useAuth();

    // Mutable refs avoid re-renders while coordinating async sync work.
    const busyRef = useRef(false);
    const profileRef = useRef(profile);
    const lastSyncRef = useRef(0);
    const retryTimersRef = useRef<number[]>([]);

    // Keep latest profile accessible inside async callbacks.
    useEffect(() => { profileRef.current = profile; }, [profile]);

    const syncToken = useCallback(async (force = false) => {
        if (!profile || busyRef.current) return;
        if (!VAPID_KEY) {
            console.warn("[FCM] Missing NEXT_PUBLIC_FIREBASE_VAPID_KEY");
            return;
        }

        // Check permission FIRST — don't burn the throttle on a guaranteed no-op.
        // NotificationGate handles prompting; we only act once granted.
        if (typeof Notification !== "undefined" && Notification.permission !== "granted") return;
        if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

        // Throttle only after this profile already has a token. First-time
        // registration must be eager, because alerts cannot send until it lands.
        const now = Date.now();
        const alreadyRegistered = !!profileRef.current?.fcm_token;
        if (!force && alreadyRegistered && now - lastSyncRef.current < SYNC_THROTTLE_MS) return;

        busyRef.current = true;

        try {
            // 1) Resolve messaging + SW registration, then request the current token.
            const messaging = await getFirebaseMessaging();
            if (!messaging) return;

            const registration = await navigator.serviceWorker.ready;

            const { getToken: getTokenFn } = await import("firebase/messaging");
            const token = await getTokenFn(messaging, {
                vapidKey: VAPID_KEY,
                serviceWorkerRegistration: registration,
            });

            if (!token) {
                console.warn("[FCM] Browser did not return a device token yet");
                return;
            }

            // 2) Persist only on token changes to reduce unnecessary DB writes.
            if (profileRef.current) {
                const didWrite = await saveFCMTokenIfChanged(token, profileRef.current.fcm_token ?? null, profileRef.current.id);
                if (didWrite) {
                    // Fire-and-forget — don't block on profile refresh
                    refreshProfile().catch(() => {});
                }
            }

            // Only stamp the throttle after successful completion so that
            // transient failures (network, Supabase) allow an immediate retry
            // on the next trigger instead of blocking for 5 minutes.
            lastSyncRef.current = Date.now();
        } catch (err) {
            // Keep errors non-fatal; the next trigger retries token sync.
            console.warn("[FCM] Token sync failed:", err);
        } finally {
            busyRef.current = false;
        }
    }, [profile, refreshProfile]);

    const clearRetries = useCallback(() => {
        retryTimersRef.current.forEach((timer) => window.clearTimeout(timer));
        retryTimersRef.current = [];
    }, []);

    const syncTokenWithRetries = useCallback(() => {
        clearRetries();
        syncToken(true);
        retryTimersRef.current = [1_500, 5_000, 12_000].map((delay) =>
            window.setTimeout(() => syncToken(true), delay),
        );
    }, [clearRetries, syncToken]);

    // ── Mount: sync token + set up foreground listener ──────────────────────
    useEffect(() => {
        if (!profile) return;

        syncTokenWithRetries();

        let unsubscribe: (() => void) | undefined;
        let cancelled = false;

        (async () => {
            try {
                const messaging = await getFirebaseMessaging();
                if (!messaging || cancelled) return;

                // Foreground payloads are rendered as browser notifications.
                unsubscribe = await onMessage(messaging, (payload) => {
                    const title = payload.data?.title;
                    const body = payload.data?.body;
                    if (title) {
                        new Notification(title, {
                            body: body ?? "",
                            icon: "/icons/icon-192.png",
                        });
                    }
                });
            } catch (err) {
                console.warn("[FCM] Foreground listener failed:", err);
            }
        })();

        return () => {
            cancelled = true;
            unsubscribe?.();
            clearRetries();
        };
    }, [clearRetries, profile, syncTokenWithRetries]);

    // ── Permission change: sync token immediately when permission is granted ─
    // NotificationGate dispatches "notification-permission-change" on the window
    // after the user interacts with the system prompt. This is the primary
    // trigger on iOS where navigator.permissions.query is unavailable.
    useEffect(() => {
        if (!profile) return;
        if (typeof Notification === "undefined") return;

        const handler = () => {
            if (Notification.permission === "granted") syncTokenWithRetries();
        };

        window.addEventListener("notification-permission-change", handler);

        // Also subscribe via Permissions API for browsers that support it
        let permCleanup: (() => void) | undefined;
        navigator.permissions
            ?.query?.({ name: "notifications" as PermissionName })
            .then((status) => {
                status.addEventListener("change", handler);
                permCleanup = () => status.removeEventListener("change", handler);
            })
            .catch(() => {});

        return () => {
            window.removeEventListener("notification-permission-change", handler);
            permCleanup?.();
        };
    }, [profile, syncTokenWithRetries]);

    // ── Visibility change: re-sync token when user returns (throttled) ─────
    useEffect(() => {
        if (!profile) return;

        const handleVisibility = () => {
            if (document.visibilityState === "visible") {
                syncToken();
            }
        };

        document.addEventListener("visibilitychange", handleVisibility);
        return () => {
            document.removeEventListener("visibilitychange", handleVisibility);
        };
    }, [profile, syncToken]);
}
