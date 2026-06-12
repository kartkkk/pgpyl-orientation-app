import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchLeaderboard,
  fetchScoreAuditLog,
  fetchFullScoreAuditLog,
  updateScore,
} from "../services/leaderboard.service";
import { useAuth } from "@/modules/auth/auth-context";
import type { LeaderboardEntry } from "@/types";

const LEADERBOARD_KEY = "leaderboard";
const AUDIT_LOG_KEY = "score-audit-log";
const TIMELINE_KEY = "score-timeline";

export function useLeaderboard() {
  return useQuery({
    queryKey: [LEADERBOARD_KEY],
    queryFn: fetchLeaderboard,
    staleTime: 30_000,
    placeholderData: (previousData) => previousData,
  });
}

export function useScoreAuditLog(enabled = true) {
  return useQuery({
    queryKey: [AUDIT_LOG_KEY],
    queryFn: () => fetchScoreAuditLog(),
    staleTime: 30_000,
    enabled,
  });
}

export function useScoreTimeline(enabled = false) {
  return useQuery({
    queryKey: [TIMELINE_KEY],
    queryFn: fetchFullScoreAuditLog,
    staleTime: 60_000,
    enabled,
  });
}

export function useUpdateScore() {
  const qc = useQueryClient();
  const { profile } = useAuth();
  return useMutation({
    mutationFn: ({
      sectionId,
      score,
      mode,
      reason,
      version,
    }: {
      sectionId: string;
      score: number;
      mode?: "set" | "adjust";
      reason?: string;
      version?: number;
    }) => updateScore(sectionId, score, mode, reason, profile?.id, version),
    onMutate: async ({ sectionId, score, mode }) => {
      await qc.cancelQueries({ queryKey: [LEADERBOARD_KEY] });
      const previous = qc.getQueryData<LeaderboardEntry[]>([LEADERBOARD_KEY]);

      qc.setQueryData<LeaderboardEntry[]>([LEADERBOARD_KEY], (old) => {
        if (!old) return old;
        return old.map((entry) => {
          if (entry.section_id !== sectionId) return entry;
          const newScore = mode === "set" ? score : entry.score + score;
          return { ...entry, score: newScore, updated_at: new Date().toISOString() };
        });
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        qc.setQueryData([LEADERBOARD_KEY], context.previous);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: [LEADERBOARD_KEY] });
      qc.invalidateQueries({ queryKey: [AUDIT_LOG_KEY] });
      qc.invalidateQueries({ queryKey: [TIMELINE_KEY] });
    },
  });
}
