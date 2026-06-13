"use client";

import { useCallback, useState } from "react";
import { BellRing, CheckCircle2, Smartphone } from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getFirebaseMessaging } from "@/lib/firebase";
import { useAuth } from "@/modules/auth/auth-context";

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export function PushRegistrationCard() {
  const { profile, refreshProfile } = useAuth();
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);

  const registerThisDevice = useCallback(async () => {
    setRegistering(true);
    setError(null);
    setStatus("Checking this device...");

    try {
      if (!VAPID_KEY) {
        throw new Error("Firebase VAPID key is missing in Vercel.");
      }

      if (typeof window === "undefined" || typeof Notification === "undefined") {
        throw new Error("This browser does not support push notifications.");
      }

      if (!("serviceWorker" in navigator)) {
        throw new Error("This browser cannot run the notification worker.");
      }

      const permission =
        Notification.permission === "granted"
          ? "granted"
          : await Notification.requestPermission();

      if (permission !== "granted") {
        throw new Error("Notifications are blocked. Please set this site to Allow notifications.");
      }

      setStatus("Preparing notification service...");
      const registration = await navigator.serviceWorker.ready;
      const messaging = await getFirebaseMessaging();

      if (!messaging) {
        throw new Error("Firebase says this browser cannot receive push notifications.");
      }

      setStatus("Registering this device...");
      const { getToken } = await import("firebase/messaging");
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration,
      });

      if (!token) {
        throw new Error("Firebase did not create a device token. Reopen the installed app and try again.");
      }

      const response = await fetch("/api/notifications/register-device", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Could not save this device.");
      }

      await refreshProfile();
      setStatus("Push notifications are ready on this device.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not enable push notifications.");
      setStatus(null);
    } finally {
      setRegistering(false);
    }
  }, [refreshProfile]);

  return (
    <Card className="space-y-3">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600">
          {profile?.fcm_token ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <BellRing className="h-5 w-5" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-foreground">Push Notifications</h2>
            <StatusBadge
              status={profile?.fcm_token ? "ready" : "not ready"}
              variant={profile?.fcm_token ? "success" : "warning"}
            />
          </div>
          <p className="mt-1 text-xs text-muted">
            {profile?.fcm_token
              ? "This device is registered for alert reminders."
              : "Register this phone once after installing the app."}
          </p>
        </div>
      </div>

      {status && (
        <div className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
          {status}
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
          {error}
        </div>
      )}

      <Button onClick={registerThisDevice} loading={registering}>
        <Smartphone className="h-4 w-4" />
        {profile?.fcm_token ? "Re-register this device" : "Register this device"}
      </Button>
    </Card>
  );
}
