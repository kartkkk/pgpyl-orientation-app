import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { fetchLatestToken } from "../services/attendance.service";

const QR_TOKEN_KEY = "qr-token";
const POLL_INTERVAL_MS = 5_000;

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
 * Polls the `qr_tokens` table for the latest valid token for a session.
 *
 * Token generation is handled exclusively by the server-side cron function
 * (`rotate-qr-token`). All clients — admin and student — poll the same
 * table and display the same QR code.
 */
export function useQRRotation({
  sessionId,
}: UseQRRotationOptions): UseQRRotationReturn {
  const qc = useQueryClient();

  const { data = null, error, isSuccess } = useQuery({
    queryKey: [QR_TOKEN_KEY, sessionId],
    queryFn: () => fetchLatestToken(sessionId!),
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
