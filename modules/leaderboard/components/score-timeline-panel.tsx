"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X, TrendingUp } from "lucide-react";
import { useAuth } from "@/modules/auth/auth-context";
import { useScoreTimeline } from "@/modules/leaderboard/hooks/useLeaderboard";
import { SECTIONS, SECTION_CODES } from "@/lib/constants";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineRetry } from "@/components/ui/inline-retry";
import type { SectionCode, ScoreAuditLog } from "@/types";

// ─── Build cumulative daily series from audit logs ─────────────────────────

interface DayPoint {
  date: string;
  label: string;
  scores: Record<SectionCode, number>;
}

function formatDayLabel(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Derive the date range from actual audit log data, then build one point per day. */
function buildTimeline(logs: ScoreAuditLog[]): DayPoint[] {
  if (!logs.length) return [];

  // Collect all unique dates and track per-section scores per day
  const dailyScores: Record<string, Record<SectionCode, number>> = {};

  for (const log of logs) {
    const code = log.section?.code as SectionCode | undefined;
    if (!code) continue;

    const day = log.created_at.slice(0, 10);
    if (!dailyScores[day]) dailyScores[day] = {} as Record<SectionCode, number>;
    dailyScores[day][code] = log.new_score;
  }

  // Determine date range: first log date → last log date
  const allDates = Object.keys(dailyScores).sort();
  const startDate = new Date(allDates[0] + "T12:00:00");
  const endDate = new Date(allDates[allDates.length - 1] + "T12:00:00");

  // Build array of every day in range
  const days: string[] = [];
  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }

  // Build series: carry forward last known score per section
  const running: Record<SectionCode, number> = {} as Record<SectionCode, number>;
  for (const code of SECTION_CODES) running[code] = 0;

  return days.map((date) => {
    const dayData = dailyScores[date];
    if (dayData) {
      for (const code of SECTION_CODES) {
        if (dayData[code] !== undefined) running[code] = dayData[code];
      }
    }
    return {
      date,
      label: formatDayLabel(date),
      scores: { ...running },
    };
  });
}

// ─── Chart Constants ───────────────────────────────────────────────────────

const CHART_H = 220;
const CHART_W_RATIO = 0.88; // of container width
const PADDING = { top: 16, right: 28, bottom: 32, left: 40 };

// ─── SVG Line Chart ────────────────────────────────────────────────────────

function TimelineChart({
  timeline,
  isolatedSection,
  userSectionCode,
  onScrub,
}: {
  timeline: DayPoint[];
  isolatedSection: SectionCode | null;
  userSectionCode: SectionCode | undefined;
  onScrub: (dayIndex: number | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerW, setContainerW] = useState(340);
  const [scrubIndex, setScrubIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  // Measure container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      setContainerW(entry.contentRect.width);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const chartW = containerW * CHART_W_RATIO;

  // Trigger draw animation after paths are measured
  const [pathsReady, setPathsReady] = useState(false);
  useEffect(() => {
    setMounted(false);
    setPathsReady(false);
  }, [timeline, containerW]);

  useEffect(() => {
    if (!pathsReady) return;
    const timer = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(timer);
  }, [pathsReady]);
  const plotW = chartW - PADDING.left - PADDING.right;
  const plotH = CHART_H - PADDING.top - PADDING.bottom;

  // Y axis range
  const allScores = timeline.flatMap((d) =>
    SECTION_CODES.map((c) => d.scores[c]),
  );
  const maxScore = Math.max(...allScores, 10);
  const minScore = Math.min(...allScores, 0);
  const yRange = maxScore - minScore || 1;

  const xStep = plotW / Math.max(timeline.length - 1, 1);

  function toX(i: number) {
    return PADDING.left + i * xStep;
  }
  function toY(val: number) {
    return PADDING.top + plotH - ((val - minScore) / yRange) * plotH;
  }

  // Build paths
  const paths = useMemo(() => {
    if (!timeline.length) return [];

    return SECTION_CODES.map((code) => {
      const points = timeline.map((d, i) => ({
        x: toX(i),
        y: toY(d.scores[code]),
      }));

      let pathD: string;
      if (points.length === 1) {
        // Single point — draw a tiny horizontal line so it's visible
        pathD = `M ${points[0].x - 2} ${points[0].y} L ${points[0].x + 2} ${points[0].y}`;
      } else {
        // Smooth cubic bezier (catmull-rom to bezier)
        pathD = `M ${points[0].x} ${points[0].y}`;
        for (let i = 0; i < points.length - 1; i++) {
          const p0 = points[Math.max(i - 1, 0)];
          const p1 = points[i];
          const p2 = points[i + 1];
          const p3 = points[Math.min(i + 2, points.length - 1)];

          const cp1x = p1.x + (p2.x - p0.x) / 6;
          const cp1y = p1.y + (p2.y - p0.y) / 6;
          const cp2x = p2.x - (p3.x - p1.x) / 6;
          const cp2y = p2.y - (p3.y - p1.y) / 6;

          pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
        }
      }

      return { code, pathD, points };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeline, chartW]);

  // Measure actual path lengths for draw animation
  const pathLengths = useRef<Record<string, number>>({});
  const measuredCount = useRef(0);
  const pathRefCallback = useCallback(
    (code: string) => (el: SVGPathElement | null) => {
      if (el) {
        pathLengths.current[code] = el.getTotalLength();
        measuredCount.current++;
        // Once all 6 section paths are measured, mark ready
        if (measuredCount.current >= SECTION_CODES.length) {
          setPathsReady(true);
        }
      }
    },
    // Reset counter when paths change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [timeline, containerW],
  );

  // Reset measurement count when paths rebuild
  useEffect(() => {
    measuredCount.current = 0;
  }, [timeline, containerW]);

  // Touch/mouse scrub handler
  const handleScrub = useCallback(
    (clientX: number) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const relX = clientX - rect.left - PADDING.left;
      const idx = Math.round(relX / xStep);
      const clamped = Math.max(0, Math.min(timeline.length - 1, idx));
      setScrubIndex(clamped);
      onScrub(clamped);
    },
    [xStep, timeline.length, onScrub],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      handleScrub(e.clientX);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [handleScrub],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (e.buttons > 0 || e.pointerType === "touch") handleScrub(e.clientX);
    },
    [handleScrub],
  );

  const handlePointerUp = useCallback(() => {
    setScrubIndex(null);
    onScrub(null);
  }, [onScrub]);

  return (
    <div ref={containerRef} className="relative w-full">
      <svg
        width={chartW}
        height={CHART_H}
        className="mx-auto block"
        style={{ touchAction: "none" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Y-axis grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
          const val = minScore + yRange * frac;
          const y = toY(val);
          return (
            <g key={frac}>
              <line
                x1={PADDING.left}
                x2={PADDING.left + plotW}
                y1={y}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth={0.5}
              />
              <text
                x={PADDING.left - 6}
                y={y + 3}
                textAnchor="end"
                className="fill-[#6b7280]"
                fontSize={9}
              >
                {Math.round(val)}
              </text>
            </g>
          );
        })}

        {/* X-axis labels — skip some when many days */}
        {timeline.map((d, i) => {
          const step = timeline.length <= 10 ? 1 : timeline.length <= 20 ? 2 : Math.ceil(timeline.length / 10);
          if (i % step !== 0 && i !== timeline.length - 1) return null;
          return (
            <text
              key={d.date}
              x={toX(i)}
              y={CHART_H - 4}
              textAnchor="middle"
              className="fill-[#6b7280]"
              fontSize={8}
            >
              {d.label}
            </text>
          );
        })}

        {/* Section lines */}
        {paths.map(({ code, pathD, points }, sectionIdx) => {
          const section = SECTIONS[code];
          const isIsolated = isolatedSection === code;
          const isDimmed =
            isolatedSection !== null && !isIsolated;
          const isUserLine = code === userSectionCode;

          // Dimmed lines: low opacity, but user's section stays semi-visible
          const opacity = isDimmed
            ? isUserLine
              ? 0.35
              : 0.1
            : 1;

          const len = pathLengths.current[code] || 5000;
          const lastPt = points[points.length - 1];

          return (
            <g key={code} opacity={opacity} style={{ transition: "opacity 300ms ease" }}>
              <path
                ref={pathRefCallback(code)}
                d={pathD}
                fill="none"
                stroke={section.color}
                strokeWidth={isIsolated || (!isolatedSection && isUserLine) ? 3 : 2}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={
                  mounted
                    ? {
                        strokeDasharray: len,
                        strokeDashoffset: 0,
                        transition: `stroke-dashoffset 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) ${sectionIdx * 120}ms`,
                      }
                    : {
                        strokeDasharray: len,
                        strokeDashoffset: len,
                      }
                }
              />
              {/* Emoji at line endpoint */}
              {lastPt && (
                <text
                  x={lastPt.x + 6}
                  y={lastPt.y + 4}
                  fontSize={10}
                  style={{
                    opacity: mounted ? 1 : 0,
                    transition: `opacity 400ms ease ${sectionIdx * 120 + 800}ms`,
                  }}
                >
                  {section.emoji}
                </text>
              )}
            </g>
          );
        })}

        {/* Scrub marker */}
        {scrubIndex !== null && (
          <>
            <line
              x1={toX(scrubIndex)}
              x2={toX(scrubIndex)}
              y1={PADDING.top}
              y2={PADDING.top + plotH}
              stroke="#003366"
              strokeWidth={1}
              strokeDasharray="4 2"
              opacity={0.5}
            />
            {/* Dots at each section's value */}
            {paths.map(({ code, points }) => {
              const isDimmed =
                isolatedSection !== null && isolatedSection !== code;
              if (isDimmed && code !== userSectionCode) return null;
              const pt = points[scrubIndex];
              return (
                <circle
                  key={code}
                  cx={pt.x}
                  cy={pt.y}
                  r={4}
                  fill={SECTIONS[code].color}
                  stroke="white"
                  strokeWidth={2}
                />
              );
            })}
          </>
        )}
      </svg>
    </div>
  );
}

// ─── Persistent Score Card ────────────────────────────────────────────────

function ScoreCard({
  timeline,
  dayIndex,
  isolatedSection,
  userSectionCode,
}: {
  timeline: DayPoint[];
  dayIndex: number;
  isolatedSection: SectionCode | null;
  userSectionCode: SectionCode | undefined;
}) {
  const day = timeline[dayIndex];
  if (!day) return null;

  const visibleSections = SECTION_CODES.filter((code) => {
    if (isolatedSection === null) return true;
    if (code === isolatedSection) return true;
    if (code === userSectionCode) return true;
    return false;
  }).sort((a, b) => day.scores[b] - day.scores[a]);

  return (
    <div className="mt-3 px-4">
      <p className="mb-2 text-xs font-semibold text-foreground">
        {day.label}
      </p>
      <div className="space-y-1.5">
        {visibleSections.map((code, i) => {
          const section = SECTIONS[code];
          return (
            <div
              key={code}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5"
              style={{
                backgroundColor:
                  code === userSectionCode ? section.light : undefined,
              }}
            >
              <span className="w-5 text-xs font-bold text-muted">
                {i + 1}.
              </span>
              <span className="text-sm">{section.emoji}</span>
              <span className="flex-1 text-sm font-medium">
                {section.name}
              </span>
              <span
                className="text-sm font-bold tabular-nums"
                style={{ color: section.color }}
              >
                {day.scores[code]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Filter Pills ──────────────────────────────────────────────────────────

function FilterPills({
  isolatedSection,
  onSelect,
}: {
  isolatedSection: SectionCode | null;
  onSelect: (code: SectionCode | null) => void;
}) {
  return (
    <div className="flex gap-1.5 overflow-x-auto px-4 pb-2 pt-1 scrollbar-none">
      <button
        onClick={() => onSelect(null)}
        className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
          isolatedSection === null
            ? "bg-primary-500 text-white"
            : "bg-gray-100 text-muted"
        }`}
      >
        All
      </button>
      {SECTION_CODES.map((code) => {
        const section = SECTIONS[code];
        const isActive = isolatedSection === code;
        return (
          <button
            key={code}
            onClick={() => onSelect(isActive ? null : code)}
            className="shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors"
            style={{
              backgroundColor: isActive ? section.color : section.light,
              color: isActive ? "white" : section.color,
            }}
          >
            {section.emoji} {section.name}
          </button>
        );
      })}
    </div>
  );
}

// ─── Panel ─────────────────────────────────────────────────────────────────

interface ScoreTimelinePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ScoreTimelinePanel({ isOpen, onClose }: ScoreTimelinePanelProps) {
  const { profile } = useAuth();
  const { data: logs, isLoading, isError, refetch } = useScoreTimeline(isOpen);
  const [isolatedSection, setIsolatedSection] = useState<SectionCode | null>(null);
  const [scrubDay, setScrubDay] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const userSectionCode = profile?.section?.code as SectionCode | undefined;

  const timeline = useMemo(
    () => (logs ? buildTimeline(logs) : []),
    [logs],
  );

  const hasData = timeline.some((d) =>
    SECTION_CODES.some((c) => d.scores[c] !== 0),
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

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onCancel={onClose}
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
            <h2 className="text-base font-semibold">Score Timeline</h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="flex h-11 w-11 items-center justify-center rounded-full active:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-0 pb-4 pt-3">
            {isLoading ? (
              <div className="flex h-60 items-center justify-center">
                <LoadingSpinner />
              </div>
            ) : isError ? (
              <div className="px-4">
                <InlineRetry
                  message="Could not load timeline data"
                  onRetry={() => refetch()}
                />
              </div>
            ) : !hasData ? (
              <div className="px-4">
                <EmptyState
                  icon={<TrendingUp className="h-10 w-10" />}
                  title="Timeline coming soon"
                  description="The score timeline will populate once orientation week begins and scores start coming in."
                />
              </div>
            ) : (
              <>
                {/* Filter pills */}
                <FilterPills
                  isolatedSection={isolatedSection}
                  onSelect={setIsolatedSection}
                />

                {/* Chart */}
                <div className="mt-2 px-2">
                  <TimelineChart
                    timeline={timeline}
                    isolatedSection={isolatedSection}
                    userSectionCode={userSectionCode}
                    onScrub={setScrubDay}
                  />
                </div>

                {/* Persistent score card — shows scrubbed day or latest */}
                <ScoreCard
                  timeline={timeline}
                  dayIndex={scrubDay ?? timeline.length - 1}
                  isolatedSection={isolatedSection}
                  userSectionCode={userSectionCode}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </dialog>
  );
}
