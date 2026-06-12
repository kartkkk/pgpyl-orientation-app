import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

const QR_TOKEN_KEY = "qr-token";
const POLL_INTERVAL_MS = 60_000;

// ─── Types ─────────────────────────────────────────────────────────────────

interface UseQRRotationOptions {
  /** The active session to poll tokens for. */
  sessionId: string | undefined;
}

interface UseQRRotationReturn {
  /** The current QR token string to display / scan. `null` until the first token arrives. */
  currentToken: string | null;
  /** The current 6-digit manual-entry code. `null` until the first token arrives. */
  currentCode: string | null;
  /** Whether we have a valid token and polling is active. */
  isActive: boolean;
  /** The last error encountered during token fetch. */
  error: Error | null;
  /** Force an immediate refetch. */
  retry: () => void;
}

// ─── Hook ──────────────────────────────────────────────────────────────────

/**
 * Creates a fresh attendance code for an open session.
 * This replaces the Supabase cron rotation so attendance can run from Vercel.
 */
export function useQRRotation({
  sessionId,
}: UseQRRotationOptions): UseQRRotationReturn {
  const qc = useQueryClient();

  const { data = null, error, isSuccess } = useQuery({
    queryKey: [QR_TOKEN_KEY, sessionId],
    queryFn: async () => {
      const response = await fetch("/api/attendance/rotate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Could not create attendance code");
      }

      return payload as { token: string; code: string | null };
    },
    enabled: !!sessionId,
    refetchInterval: POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
  });

  const retry = useCallback(() => {
    qc.invalidateQueries({ queryKey: [QR_TOKEN_KEY, sessionId] });
  }, [qc, sessionId]);

  return {
    currentToken: data?.token ?? null,
    currentCode: data?.code ?? null,
    isActive: isSuccess && data?.token != null,
    error: error as Error | null,
    retry,
  };
}
