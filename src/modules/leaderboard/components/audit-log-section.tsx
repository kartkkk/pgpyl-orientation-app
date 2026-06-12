"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { StatusBadge } from "@/components/ui/badge";
import { useScoreAuditLog } from "@/modules/leaderboard/hooks/useLeaderboard";
import { SECTIONS } from "@/lib/constants";
import { timeAgo } from "@/lib/utils";
import type { ScoreAuditLog, SectionCode } from "@/types";

const INITIAL_COUNT = 20;

export function AuditLogSection() {
  const { data: logs, isLoading } = useScoreAuditLog();
  const [expanded, setExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const visibleLogs = logs
    ? showAll
      ? logs
      : logs.slice(0, INITIAL_COUNT)
    : [];

  const hasMore = (logs?.length ?? 0) > INITIAL_COUNT && !showAll;

  return (
    <div className="mt-6">
      <button
        onClick={() => setExpanded((p) => !p)}
        className="flex w-full items-center justify-between py-2"
      >
        <span className="text-sm font-semibold">Score History</span>
        <ChevronDown
          className={`h-4 w-4 text-muted transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {expanded && (
        <div className="space-y-2 pt-1">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <LoadingSpinner size="sm" />
            </div>
          ) : !visibleLogs.length ? (
            <p className="py-3 text-center text-xs text-muted">
              No score changes recorded yet.
            </p>
          ) : (
            <>
              {visibleLogs.map((log) => (
                <AuditLogEntry key={log.id} log={log} />
              ))}
              {hasMore && (
                <button
                  onClick={() => setShowAll(true)}
                  className="w-full py-2 text-center text-xs font-medium text-primary-500 active:text-primary-600"
                >
                  Show more
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function AuditLogEntry({ log }: { log: ScoreAuditLog }) {
  const sc = log.section as { code: string; name: string } | undefined;
  const sectionMeta = sc?.code ? SECTIONS[sc.code as SectionCode] : null;
  const who =
    (log.profile as { full_name?: string } | undefined)?.full_name ?? "Unknown";

  const deltaLabel = log.delta >= 0 ? `+${log.delta}` : `${log.delta}`;
  const deltaVariant: "success" | "error" | "muted" =
    log.delta > 0 ? "success" : log.delta < 0 ? "error" : "muted";

  return (
    <Card className="!p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium">
            {sectionMeta?.emoji ?? ""}{" "}
            {sectionMeta?.name ?? sc?.code ?? "?"}
          </p>
          <p className="text-[10px] text-muted">
            {who} &middot; {timeAgo(log.created_at)}
          </p>
          {log.reason && (
            <p className="mt-0.5 text-[10px] italic text-muted">
              {log.reason}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <StatusBadge status={deltaLabel} variant={deltaVariant} />
          <span className="text-[10px] text-muted">
            {log.old_score} &rarr; {log.new_score}
          </span>
        </div>
      </div>
    </Card>
  );
}
