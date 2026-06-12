"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { APP_NAME } from "@/lib/constants";
import { Wifi, WifiOff } from "lucide-react";
import { useNetworkStatus } from "@/hooks/use-network-status";

export default function OfflinePage() {
  const { isOnline } = useNetworkStatus();
  const router = useRouter();

  useEffect(() => {
    if (!isOnline) return;

    const timer = setTimeout(() => {
      router.replace("/events");
    }, 900);

    return () => clearTimeout(timer);
  }, [isOnline, router]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="space-y-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-500">
            <span className="text-2xl font-bold text-white">ITA</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">{APP_NAME}</h1>
        </div>

        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <div className="flex flex-col items-center gap-4">
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-full ${
                isOnline ? "bg-green-100" : "bg-warning/10"
              }`}
            >
              {isOnline ? (
                <Wifi className="h-7 w-7 text-green-700" />
              ) : (
                <WifiOff className="h-7 w-7 text-warning" />
              )}
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-foreground">
                {isOnline ? "Back online" : "You&apos;re offline"}
              </h2>
              <p className="text-sm text-muted">
                {isOnline
                  ? "Taking you back to the app..."
                  : "Check your internet connection and try again"}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (isOnline) {
              router.replace("/events");
              return;
            }
            window.location.reload();
          }}
          className="w-full rounded-xl bg-primary-500 px-4 py-3.5 text-sm font-semibold text-white transition-colors active:bg-primary-600"
        >
          {isOnline ? "Continue" : "Retry"}
        </button>
      </div>
    </div>
  );
}
