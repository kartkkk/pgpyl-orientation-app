import { useCallback, useEffect, useState } from "react";

export function useSwUpdate() {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [updateId, setUpdateId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    let cancelled = false;

    navigator.serviceWorker.ready.then((registration) => {
      if (cancelled) return;

      // Check if there's already a waiting worker
      if (registration.waiting) {
        setWaitingWorker(registration.waiting);
        setHasUpdate(true);
        setUpdateId(registration.waiting.scriptURL || "sw-update");
      }

      // Listen for new updates
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            // New SW installed and waiting — means there's an update
            setWaitingWorker(newWorker);
            setHasUpdate(true);
            setUpdateId(newWorker.scriptURL || "sw-update");
          }
        });
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-apply as soon as a waiting worker is detected
  useEffect(() => {
    if (!waitingWorker) return;

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      () => window.location.reload(),
      { once: true },
    );

    waitingWorker.postMessage({ type: "SKIP_WAITING" });
  }, [waitingWorker]);

  return { hasUpdate, updateId };
}
