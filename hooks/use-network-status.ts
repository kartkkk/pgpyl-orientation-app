import { useSyncExternalStore } from "react";

function getIsOnline() {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

function subscribe(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

function getServerSnapshot() {
  return true;
}

export function useNetworkStatus() {
  const isOnline = useSyncExternalStore(subscribe, getIsOnline, getServerSnapshot);
  return { isOnline };
}
