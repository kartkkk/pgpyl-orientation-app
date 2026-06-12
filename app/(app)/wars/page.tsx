"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Trophy, Pencil, Plus, Minus, Settings, BarChart3, Clock, X, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineRetry } from "@/components/ui/inline-retry";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { PullRefreshShell } from "@/components/ui/pull-refresh-shell";
import { RefreshBar } from "@/components/ui/refresh-bar";
import { useToast } from "@/components/ui/toast";
import {
  useLeaderboard,
  useUpdateScore,
} from "@/modules/leaderboard/hooks/useLeaderboard";
import { useAuth } from "@/modules/auth/auth-context";
import { SECTIONS } from "@/lib/constants";

const ScoreTimelinePanel = dynamic(
  () => import("@/modules/leaderboard/components/score-timeline-panel").then((m) => m.ScoreTimelinePanel),
  { ssr: false },
);
const ScoreHistoryPanel = dynamic(
  () => import("@/modules/leaderboard/components/score-history-panel").then((m) => m.ScoreHistoryPanel),
  { ssr: false },
);
import { timeAgo } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import type { SectionCode, LeaderboardEntry } from "@/types";

// ─── Medal Colors ──────────────────────────────────────────────────────────

const MEDAL_COLORS: Record<number, { bg: string; shadow: string }> = {
  1: { bg: "#C9A44C", shadow: "rgba(201,164,76,0.4)" },
  2: { bg: "#A8B2C1", shadow: "rgba(168,178,193,0.4)" },
  3: { bg: "#C47B3A", shadow: "rgba(196,123,58,0.4)" },
};

// ─── Score Action Types ────────────────────────────────────────────────────

type ScoreAction = "add" | "remove" | "set";

const ACTION_CONFIG: Record<
  ScoreAction,
  { label: string; icon: typeof Plus; tone: "default" | "danger"; placeholder: string }
> = {
  add: { label: "Add Score", icon: Plus, tone: "default", placeholder: "Points to add" },
  remove: { label: "Remove Score", icon: Minus, tone: "danger", placeholder: "Points to remove" },
  set: { label: "Set Score", icon: Settings, tone: "default", placeholder: "New score value" },
};

// ─── Page ──────────────────────────────────────────────────────────────────

export default function WarsPage() {
  const { role, profile } = useAuth();
  const isAdmin = role === "admin";
  const [showTimeline, setShowTimeline] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showEditPanel, setShowEditPanel] = useState(false);
  const {
    data: entries,
    isLoading,
    isFetching,
    isError,
    error,
    dataUpdatedAt,
    refetch,
  } = useLeaderboard();

  // ── Supabase Realtime ──────────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel("leaderboard-realtime")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "section_leaderboard",
        },
        () => {
          refetch();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const onRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const sorted = useMemo(
    () => (entries ? [...entries].sort((a, b) => b.score - a.score) : []),
    [entries],
  );

  const leaderScore = sorted.length > 0 ? Math.max(sorted[0].score, 1) : 1;
  const userSectionCode = profile?.section?.code as SectionCode | undefined;

  return (
    <>
      <PageHeader
        title="Section Wars"
        action={
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setShowTimeline(true)}
              aria-label="Score timeline"
              className="flex h-9 w-9 items-center justify-center rounded-full text-primary-500 active:bg-gray-100"
            >
              <BarChart3 className="h-[22px] w-[22px]" />
            </button>
            <button
              onClick={() => setShowHistory(true)}
              aria-label="Score history"
              className="flex h-9 w-9 items-center justify-center rounded-full text-primary-500 active:bg-gray-100"
            >
              <Clock className="h-[22px] w-[22px]" />
            </button>
            {isAdmin && (
              <button
                onClick={() => setShowEditPanel(true)}
                aria-label="Edit scores"
                className="flex h-9 w-9 items-center justify-center rounded-full text-primary-500 active:bg-gray-100"
              >
                <Pencil className="h-[18px] w-[18px]" />
              </button>
            )}
          </div>
        }
      />
      <RefreshBar visible={isFetching && !isLoading} />

      <PullRefreshShell onRefresh={onRefresh}>
        <div className="space-y-3 p-4 pb-24">
          {isLoading ? (
            <ListSkeleton rows={6} rowHeightClassName="h-24" />
          ) : isError ? (
            <InlineRetry
              message={error instanceof Error ? error.message : "Could not load scores"}
              onRetry={() => refetch()}
            />
          ) : !sorted.length ? (
            <EmptyState
              icon={<Trophy className="h-10 w-10" />}
              title="No scores yet"
            />
          ) : (
            <>
              {sorted.map((entry, index) => (
                <LeaderboardCard
                  key={entry.id}
                  entry={entry}
                  rank={index + 1}
                  leaderScore={leaderScore}
                  staggerIndex={index}
                  isUserSection={
                    !!userSectionCode &&
                    entry.section?.code === userSectionCode
                  }
                />
              ))}

              {dataUpdatedAt > 0 && (
                <p className="pt-1 text-center text-[10px] text-muted">
                  Updated {timeAgo(new Date(dataUpdatedAt).toISOString())}
                </p>
              )}

            </>
          )}
        </div>
      </PullRefreshShell>

      <ScoreTimelinePanel
        isOpen={showTimeline}
        onClose={() => setShowTimeline(false)}
      />

      <ScoreHistoryPanel
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />
      {isAdmin && (
        <EditScorePanel
          isOpen={showEditPanel}
          onClose={() => setShowEditPanel(false)}
          entries={sorted}
        />
      )}
    </>
  );
}

// ─── Tier Sizing ───────────────────────────────────────────────────────────

function getTierStyles(rank: number) {
  if (rank === 1)
    return { avatarSize: 64, scoreSize: 26, paddingPx: 24, emojiSize: "text-3xl", medalSize: 44 };
  if (rank === 2)
    return { avatarSize: 44, scoreSize: 22, paddingPx: 16, emojiSize: "text-xl", medalSize: 32 };
  if (rank === 3)
    return { avatarSize: 44, scoreSize: 22, paddingPx: 16, emojiSize: "text-xl", medalSize: 32 };
  return { avatarSize: 36, scoreSize: 18, paddingPx: 12, emojiSize: "text-base", medalSize: 28 };
}

// ─── Podium Card Styles ────────────────────────────────────────────────────

const PODIUM_STYLES: Record<number, { gradient: string; border: string }> = {
  1: {
    gradient: "linear-gradient(180deg, #FAF3E0 0%, #FDF8EF 40%, #FFFFFF 100%)",
    border: "#C9A44C",
  },
  2: {
    gradient: "linear-gradient(180deg, #F0F2F5 0%, #F6F7F9 40%, #FFFFFF 100%)",
    border: "#A8B2C1",
  },
  3: {
    gradient: "linear-gradient(180deg, #FBF3ED 0%, #FDF7F2 40%, #FFFFFF 100%)",
    border: "#C47B3A",
  },
};

// ─── Medal Badge ───────────────────────────────────────────────────────────

function MedalBadge({ rank, size }: { rank: number; size: number }) {
  const medal = MEDAL_COLORS[rank];

  if (medal) {
    return (
      <div
        className="flex shrink-0 items-center justify-center rounded-full font-extrabold text-white"
        style={{
          width: size,
          height: size,
          backgroundColor: medal.bg,
          boxShadow: rank === 1
            ? `0 4px 14px ${medal.shadow}, 0 0 0 3px rgba(201,164,76,0.15)`
            : `0 2px 8px ${medal.shadow}`,
          fontSize: size * 0.42,
        }}
      >
        {rank}
      </div>
    );
  }

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-gray-100 font-bold text-muted"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      #{rank}
    </div>
  );
}

// ─── Animated Score Display ────────────────────────────────────────────────

function AnimatedScore({
  value,
  color,
  fontSize,
}: {
  value: number;
  color: string | undefined;
  fontSize: number;
}) {
  const displayRef = useRef<HTMLSpanElement>(null);
  const prevValue = useRef(value);
  const [delta, setDelta] = useState<number | null>(null);

  useEffect(() => {
    if (prevValue.current === value) return;

    const diff = value - prevValue.current;
    const from = prevValue.current;
    prevValue.current = value;

    // Show floating delta
    setDelta(diff);
    const deltaTimer = setTimeout(() => setDelta(null), 850);

    // Animate counter
    const el = displayRef.current;
    if (!el) return;

    const duration = 600;
    const start = performance.now();

    function tick(now: number) {
      const elapsed = Math.min(now - start, duration);
      const progress = elapsed / duration;
      // ease-out quad
      const eased = 1 - (1 - progress) * (1 - progress);
      const current = Math.round(from + diff * eased);
      if (el) el.textContent = String(current);
      if (elapsed < duration) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    return () => clearTimeout(deltaTimer);
  }, [value]);

  return (
    <div className="relative text-right">
      <p className="font-bold" style={{ color, fontSize }}>
        <span ref={displayRef}>{value}</span>
      </p>
      <p className="text-[10px] text-muted uppercase">points</p>

      {/* Floating delta label */}
      {delta !== null && (
        <span
          className="animate-float-delta pointer-events-none absolute -top-3 right-0 text-xs font-bold"
          style={{ color: delta >= 0 ? "var(--color-success)" : "var(--color-error)" }}
        >
          {delta >= 0 ? "+" : ""}{delta}
        </span>
      )}
    </div>
  );
}

// ─── Leaderboard Card ──────────────────────────────────────────────────────

function LeaderboardCard({
  entry,
  rank,
  leaderScore,
  staggerIndex,
  isUserSection,
}: {
  entry: LeaderboardEntry;
  rank: number;
  leaderScore: number;
  staggerIndex: number;
  isUserSection: boolean;
}) {
  const code = entry.section?.code as SectionCode | undefined;
  const section = code ? SECTIONS[code] : null;
  const tier = getTierStyles(rank);

  const isNegative = entry.score < 0;
  const progressRatio = leaderScore > 0 ? Math.max(entry.score / leaderScore, 0) : 0;
  const podium = PODIUM_STYLES[rank];

  const scoreColor = isNegative
    ? "var(--color-error-text)"
    : rank <= 3
      ? MEDAL_COLORS[rank].bg
      : undefined;

  // Card background: negative > podium gradient > user section tint > default
  const cardStyle: React.CSSProperties = { padding: tier.paddingPx };
  if (isNegative) {
    cardStyle.backgroundColor = "var(--color-error-wash)";
  } else if (podium) {
    cardStyle.background = podium.gradient;
    cardStyle.borderColor = podium.border;
  } else if (isUserSection) {
    cardStyle.backgroundColor = section?.light;
  }

  return (
    <Card
      className="leaderboard-card"
      style={cardStyle}
    >
      {/* Main row */}
      <div className="relative flex items-center gap-3">
        <MedalBadge rank={rank} size={tier.medalSize} />

        <div
          className={`flex shrink-0 items-center justify-center rounded-full ${tier.emojiSize}`}
          style={{
            width: tier.avatarSize,
            height: tier.avatarSize,
            backgroundColor: section?.color + "20",
          }}
        >
          {section?.emoji}
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={rank === 1 ? "font-bold truncate leading-tight" : "font-semibold truncate leading-tight"}
            style={{ fontSize: rank === 1 ? 16 : rank <= 3 ? 14 : 13 }}
            title={section?.name}
          >
            {section?.name || "Unknown"}
          </p>

          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full animate-spring-grow"
              style={{
                width: `${progressRatio * 100}%`,
                backgroundColor: section?.color,
                animationDelay: `${staggerIndex * 50}ms`,
                animationFillMode: "both",
              }}
            />
          </div>
        </div>

        {/* Score */}
        <div className="shrink-0">
          <AnimatedScore value={entry.score} color={scoreColor} fontSize={tier.scoreSize} />
        </div>
      </div>
    </Card>
  );
}

// ─── Edit Score Panel (Bottom Sheet) ──────────────────────────────────────

function EditScorePanel({
  isOpen,
  onClose,
  entries,
}: {
  isOpen: boolean;
  onClose: () => void;
  entries: LeaderboardEntry[];
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selectedEntry, setSelectedEntry] = useState<LeaderboardEntry | null>(null);
  const [activeAction, setActiveAction] = useState<ScoreAction | null>(null);
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");
  const [confirming, setConfirming] = useState(false);
  const updateScore = useUpdateScore();
  const { toast } = useToast();

  // Sort entries alphabetically by section name
  const sortedEntries = useMemo(
    () =>
      [...entries].sort((a, b) => {
        const nameA = a.section?.code ?? "";
        const nameB = b.section?.code ?? "";
        return nameA.localeCompare(nameB);
      }),
    [entries],
  );

  // Dialog open/close
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setSelectedEntry(null);
    setActiveAction(null);
    setValue("");
    setReason("");
    setConfirming(false);
    onClose();
  }, [onClose]);

  const handleBack = useCallback(() => {
    if (activeAction !== null) {
      setActiveAction(null);
      setValue("");
      setReason("");
    } else {
      setSelectedEntry(null);
    }
  }, [activeAction]);

  const selectedCode = selectedEntry?.section?.code as SectionCode | undefined;
  const selectedSection = selectedCode ? SECTIONS[selectedCode] : null;
  const sectionName = selectedSection?.name ?? "Unknown";

  const parsed = parseInt(value, 10);
  const isWholeNumber = value === parsed.toString();
  const isValid =
    !isNaN(parsed) &&
    isWholeNumber &&
    reason.trim().length > 0 &&
    (activeAction === "set"
      ? parsed >= 0 && parsed <= 10000
      : parsed > 0 && parsed <= 10000);

  const confirmDescription = activeAction
    ? activeAction === "add"
      ? `Add ${parsed} points to ${sectionName}?`
      : activeAction === "remove"
        ? `Remove ${parsed} points from ${sectionName}?`
        : `Set ${sectionName} score to ${parsed}? (currently ${selectedEntry?.score})`
    : "";

  const handleConfirm = async () => {
    if (!selectedEntry || !activeAction) return;
    try {
      const selectedVersion =
        "version" in selectedEntry && typeof selectedEntry.version === "number"
          ? selectedEntry.version
          : undefined;
      const scoreValue =
        activeAction === "add"
          ? parsed
          : activeAction === "remove"
            ? -parsed
            : parsed;
      const mode = activeAction === "set" ? "set" : "adjust";

      await updateScore.mutateAsync({
        sectionId: selectedEntry.section_id,
        score: scoreValue,
        mode,
        reason: reason.trim(),
        version: mode === "set" ? selectedVersion : undefined,
      });
      toast("Score updated", "success");
      handleClose();
    } catch {
      toast("Failed to update score", "error");
    }
    setConfirming(false);
  };

  // Determine header title
  const headerTitle = !selectedEntry
    ? "Edit Score"
    : !activeAction
      ? `${selectedSection?.emoji} ${sectionName}`
      : ACTION_CONFIG[activeAction].label;

  return (
    <>
      <dialog
        ref={dialogRef}
        onClose={handleClose}
        onCancel={handleClose}
        className="fixed inset-0 m-0 h-full w-full max-h-full max-w-full bg-transparent p-0 backdrop:bg-black/40"
      >
        <div className="flex h-full items-end">
          <div className="flex w-full max-h-[80dvh] flex-col rounded-t-2xl bg-white pb-[env(safe-area-inset-bottom)]">
            {/* Handle */}
            <div className="flex justify-center pt-2 pb-1">
              <div className="h-1 w-10 rounded-full bg-gray-200" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-2">
              {selectedEntry ? (
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1 text-sm text-primary-500 active:opacity-70"
                >
                  <ChevronRight className="h-4 w-4 rotate-180" />
                  Back
                </button>
              ) : (
                <div />
              )}
              <h2 className="text-base font-semibold">{headerTitle}</h2>
              <button
                onClick={handleClose}
                aria-label="Close"
                className="flex h-11 w-11 items-center justify-center rounded-full active:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3">
              {!selectedEntry ? (
                /* Step 1: Section selection */
                <div className="space-y-1.5">
                  <p className="mb-3 text-xs text-muted">Select a section to edit</p>
                  {sortedEntries.map((entry) => {
                    const code = entry.section?.code as SectionCode | undefined;
                    const sec = code ? SECTIONS[code] : null;
                    return (
                      <button
                        key={entry.id}
                        onClick={() => setSelectedEntry(entry)}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors active:bg-gray-50"
                        style={{ backgroundColor: sec?.light + "60" }}
                      >
                        <span className="text-xl">{sec?.emoji}</span>
                        <span className="flex-1 text-sm font-medium">{sec?.name}</span>
                        <span className="text-xs font-semibold tabular-nums text-muted">
                          {entry.score} pts
                        </span>
                        <ChevronRight className="h-4 w-4 text-gray-300" />
                      </button>
                    );
                  })}
                </div>
              ) : !activeAction ? (
                /* Step 2: Action selection */
                <div className="space-y-2">
                  <p className="mb-3 text-xs text-muted">
                    Current score: <span className="font-semibold">{selectedEntry.score}</span>
                  </p>
                  {(["add", "remove", "set"] as const).map((action) => {
                    const cfg = ACTION_CONFIG[action];
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={action}
                        onClick={() => setActiveAction(action)}
                        className={`flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left transition-colors active:opacity-80 ${
                          action === "remove"
                            ? "bg-red-50 text-red-600"
                            : "bg-gray-50 text-gray-700"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{cfg.label}</span>
                        <ChevronRight className="ml-auto h-4 w-4 text-gray-300" />
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* Step 3: Enter value & reason */
                <div className="space-y-4">
                  <p className="text-xs text-muted">
                    {activeAction === "set"
                      ? `Replace ${sectionName}'s current score (${selectedEntry.score}).`
                      : activeAction === "add"
                        ? `Add points to ${sectionName}'s current score (${selectedEntry.score}).`
                        : `Remove points from ${sectionName}'s current score (${selectedEntry.score}).`}
                  </p>

                  <Input
                    label="Points"
                    placeholder={ACTION_CONFIG[activeAction].placeholder}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    type="number"
                    min={activeAction === "set" ? "0" : "1"}
                    max="10000"
                    error={
                      value && !isWholeNumber
                        ? "Enter a whole number"
                        : value && parsed > 10000
                          ? "Max 10,000"
                          : value && activeAction !== "set" && parsed < 1
                            ? "Must be at least 1"
                            : undefined
                    }
                  />

                  <Input
                    label="Reason"
                    placeholder="Why this change?"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleBack} fullWidth>
                      Cancel
                    </Button>
                    <Button
                      variant={activeAction === "remove" ? "destructive" : "primary"}
                      onClick={() => setConfirming(true)}
                      disabled={!isValid}
                      fullWidth
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </dialog>

      <ConfirmDialog
        isOpen={confirming}
        title="Confirm Score Change"
        description={confirmDescription}
        confirmLabel="Confirm"
        tone={activeAction === "remove" ? "danger" : "default"}
        isLoading={updateScore.isPending}
        onCancel={() => setConfirming(false)}
        onConfirm={handleConfirm}
      />
    </>
  );
}
