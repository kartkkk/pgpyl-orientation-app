"use client";

import { useEffect } from "react";

const RESET_VERSION = "pgpyl-clear-pwa-cache-2026-06-12-v2";

export function ServiceWorkerReset() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(RESET_VERSION) === "done") return;

    async function clearOldAppCache() {
      try {
        if ("serviceWorker" in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map((registration) => registration.unregister()));
        }

        if ("caches" in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
        }
      } finally {
        window.localStorage.setItem(RESET_VERSION, "done");
        window.location.reload();
      }
    }

    void clearOldAppCache();
  }, []);

  return null;
}
