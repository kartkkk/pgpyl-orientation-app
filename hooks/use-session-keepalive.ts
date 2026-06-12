import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

const REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Safety-net session refresh for long-lived tabs.
 *
 * With a 24-hour JWT expiry the token almost never expires during normal use.
 * This interval covers the edge case of a tab staying open for over a day
 * without any navigation or visibility change.
 */
export function useSessionKeepAlive() {
  useEffect(() => {
    const interval = setInterval(() => {
      supabase.auth.getSession();
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);
}
