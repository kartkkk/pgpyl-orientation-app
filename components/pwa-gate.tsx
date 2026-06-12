"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";

function getIsStandalone(): boolean {
  if (typeof window === "undefined") return true;

  // Skip gate entirely in development
  if (process.env.NODE_ENV === "development") return true;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator &&
      (window.navigator as unknown as { standalone: boolean }).standalone)
  );
}

function subscribe(cb: () => void) {
  const mql = window.matchMedia("(display-mode: standalone)");
  mql.addEventListener("change", cb);
  return () => mql.removeEventListener("change", cb);
}

function getServerSnapshot() {
  return true;
}

export function PWAGate({ children }: { children: React.ReactNode }) {
  const isPWA = useSyncExternalStore(
    subscribe,
    getIsStandalone,
    getServerSnapshot,
  );
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isPWA && pathname !== "/install") {
      router.replace("/install");
    }
  }, [isPWA, pathname, router]);

  if (pathname === "/install") {
    return <>{children}</>;
  }

  if (isPWA) {
    return <>{children}</>;
  }

  return null;
}
