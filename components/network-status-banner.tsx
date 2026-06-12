"use client";

import { useEffect, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";
import { useNetworkStatus } from "@/hooks/use-network-status";

export function NetworkStatusBanner() {
  const { isOnline } = useNetworkStatus();
  const [showBackOnline, setShowBackOnline] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const onOnline = () => {
      if (timer) clearTimeout(timer);
      setShowBackOnline(true);
      timer = setTimeout(() => setShowBackOnline(false), 2200);
    };

    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("online", onOnline);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const shouldShow = !isOnline || showBackOnline;

  return (
    <div
      className={`overflow-hidden transition-all duration-300 ease-in-out ${
        shouldShow ? "max-h-12" : "max-h-0"
      }`}
    >
      {isOnline ? (
        <div className="flex items-center justify-center gap-2 bg-green-50 px-4 py-2.5 text-sm font-medium text-green-700">
          <Wifi className="h-4 w-4 shrink-0" />
          Back online
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2 bg-warning/10 px-4 py-2.5 text-sm font-medium text-warning">
          <WifiOff className="h-4 w-4 shrink-0" />
          You&apos;re offline
        </div>
      )}
    </div>
  );
}
