"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { StatusBadge } from "@/components/ui/badge";
import { useScoreAuditLog } from "@/modules/leaderboard/hooks/useLeaderboard";
import { SECTIONS } from "@/lib/constants";
import { timeAgo } from "@/lib/utils";
import type { ScoreAuditLog, SectionCode } from "@/types";

const INITIAL_COUNT = 20;

interface ScoreHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ScoreHistoryPanel({ isOpen, onClose }: ScoreHistoryPanelProps) {
  const { data: logs, isLoading } = useScoreAuditLog(isOpen);
  const [showAll, setShowAll] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const visibleLogs = logs
    ? showAll
      ? logs
      : logs.slice(0, INITIAL_COUNT)
    : [];

  const hasMore = (logs?.length ?? 0) > INITIAL_COUNT && !showAll;

  const handleClose = useCallback(() => {
    setShowAll(false);
    onClose();
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      onClose={handleClose}
      onCancel={handleClose}
      className="fixed inset-0 m-0 h-full w-full max-h-full max-w-full bg-transparent p-0 backdrop:bg-black/40"
    >
      <div className="flex h-full items-end">
        <div className="flex w-full max-h-[92dvh] flex-col rounded-t-2xl bg-white pb-[env(safe-area-inset-bottom)]">
          {/* Handle */}
          <div className="flex justify-center pt-2 pb-1">
            <div className="h-1 w-10 rounded-full bg-gray-200" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-2">
            <h2 className="text-base font-semibold">Score History</h2>
            <button
              onClick={handleClose}
              aria-label="Close"
              className="flex h-11 w-11 items-center justify-center rounded-full active:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-4 pt-3">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="sm" />
              </div>
            ) : !visibleLogs.length ? (
              <p className="py-6 text-center text-xs text-muted">
                No score changes recorded yet.
              </p>
            ) : (
              <div className="space-y-2">
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
              </div>
            )}
          </div>
        </div>
      </div>
    </dialog>
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
