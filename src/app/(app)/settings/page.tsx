"use client";

import { useCallback, useDeferredValue, useMemo, useState } from "react";
import { BellRing, CheckCircle2, Shield, Smartphone } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { ClearSearchButton } from "@/components/ui/clear-search-button";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineRetry } from "@/components/ui/inline-retry";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { PullRefreshShell } from "@/components/ui/pull-refresh-shell";
import { SearchInput } from "@/components/ui/search-input";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getFirebaseMessaging } from "@/lib/firebase";
import { useAdmins } from "@/modules/admin/hooks/useAdmin";
import { useAuth } from "@/modules/auth/auth-context";
import { getInitials, timeAgo } from "@/lib/utils";

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export default function SettingsPage() {
  const { profile, refreshProfile } = useAuth();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const normalizedSearch = deferredSearch.trim().toLowerCase();
  const isSearching = search !== deferredSearch;
  const [pushStatus, setPushStatus] = useState<string | null>(null);
  const [pushError, setPushError] = useState<string | null>(null);
  const [registeringPush, setRegisteringPush] = useState(false);

  const { data: admins, isLoading, isError, error, refetch, dataUpdatedAt } = useAdmins();

  const onRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const refreshedLabel =
    dataUpdatedAt > 0 ? `Updated ${timeAgo(new Date(dataUpdatedAt).toISOString())}` : null;

  const filteredAdmins = useMemo(() => {
    if (!admins) return admins;
    if (!normalizedSearch) return admins;

    return admins.filter((admin) => {
      const haystack = `${admin.full_name} ${admin.email}`.toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [admins, normalizedSearch]);

  const countLabel = filteredAdmins?.length ?? 0;

  const registerThisDevice = useCallback(async () => {
    setRegisteringPush(true);
    setPushError(null);
    setPushStatus("Checking this device...");

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

      setPushStatus("Preparing notification service...");
      const registration = await navigator.serviceWorker.ready;
      const messaging = await getFirebaseMessaging();

      if (!messaging) {
        throw new Error("Firebase says this browser cannot receive push notifications.");
      }

      setPushStatus("Registering this device...");
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
      setPushStatus("Push notifications are ready on this device.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not enable push notifications.";
      setPushError(message);
      setPushStatus(null);
    } finally {
      setRegisteringPush(false);
    }
  }, [refreshProfile]);

  return (
    <>
      <PageHeader title="Settings" showBack />

      <PullRefreshShell onRefresh={onRefresh}>
        <div className="space-y-4 p-4">
          {/* Current user card */}
          {profile && (
            <Card className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-600">
                {getInitials(profile.full_name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {profile.full_name}
                </p>
                <p className="truncate text-xs text-muted">{profile.email}</p>
              </div>
              <StatusBadge
                status={profile.role}
                variant={profile.role === "admin" ? "warning" : "muted"}
              />
            </Card>
          )}

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

            {pushStatus && (
              <div className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
                {pushStatus}
              </div>
            )}

            {pushError && (
              <div className="rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                {pushError}
              </div>
            )}

            <Button onClick={registerThisDevice} loading={registeringPush}>
              <Smartphone className="h-4 w-4" />
              {profile?.fcm_token ? "Re-register this device" : "Register this device"}
            </Button>
          </Card>

          {/* Admin list */}
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">
              Admins
            </h2>

            <SearchInput
              placeholder="Enter an admin name or email"
              value={search}
              onChange={setSearch}
              isSearching={isSearching}
              onClear={() => setSearch("")}
            />

            {refreshedLabel && <p className="text-[10px] text-muted">{refreshedLabel}</p>}

            {!!countLabel && (
              <p className="text-xs text-muted">
                {countLabel} admin{countLabel !== 1 ? "s" : ""}
              </p>
            )}

            {isLoading ? (
              <ListSkeleton
                rows={3}
                rowHeightClassName="h-20"
                searching={normalizedSearch.length > 0 && isSearching}
                searchingLabel="Filtering admins..."
              />
            ) : isError ? (
              <InlineRetry
                message={error instanceof Error ? error.message : "Could not load admins"}
                onRetry={() => refetch()}
              />
            ) : !filteredAdmins?.length ? (
              <EmptyState
                icon={<Shield className="h-10 w-10" />}
                title={normalizedSearch ? "No matching admins" : "No admins"}
                description={
                  normalizedSearch
                    ? "Try a different search term"
                    : "No admin users found"
                }
                action={
                  normalizedSearch ? (
                    <ClearSearchButton onClear={() => setSearch("")} />
                  ) : undefined
                }
              />
            ) : (
              filteredAdmins.map((admin) => (
                <Card key={admin.id} className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-semibold text-amber-700">
                    {getInitials(admin.full_name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {admin.full_name}
                    </p>
                    <p className="truncate text-xs text-muted">{admin.email}</p>
                    {admin.promoted_at && (
                      <p className="text-xs text-muted">
                        Promoted {timeAgo(admin.promoted_at)}
                      </p>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </PullRefreshShell>
    </>
  );
}
