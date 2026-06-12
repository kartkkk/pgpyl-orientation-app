"use client";

import { useMemo } from "react";
import { AlertTriangle, ExternalLink, Swords } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

const IST_TIMEZONE = "Asia/Kolkata";

interface MemeWarsDay {
  day: number;
  dateKey: string;
  label: string;
  formUrl: string;
}

const MEME_WARS_SCHEDULE: MemeWarsDay[] = [
  { day: 1, dateKey: "2026-04-13", label: "Day 1 — April 13", formUrl: "https://forms.gle/YDuBrbh53yxLGJzi8" },
  { day: 2, dateKey: "2026-04-14", label: "Day 2 — April 14", formUrl: "https://forms.gle/bE3TScNYg7orT7v2A" },
  { day: 3, dateKey: "2026-04-15", label: "Day 3 — April 15", formUrl: "https://forms.gle/eMWgMGnZgb9T6ZbV9" },
  { day: 4, dateKey: "2026-04-16", label: "Day 4 — April 16", formUrl: "https://forms.gle/rqd1n7AKw6X2nT6n7" },
  { day: 5, dateKey: "2026-04-17", label: "Day 5 — April 17", formUrl: "https://forms.gle/X34UtbmYQngxR9en7" },
];

function getIstDateKey(date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: IST_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find((p) => p.type === "year")?.value ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const day = parts.find((p) => p.type === "day")?.value ?? "";
  return `${year}-${month}-${day}`;
}

function getTodayEntry(): MemeWarsDay | null {
  const today = getIstDateKey();
  return MEME_WARS_SCHEDULE.find((entry) => entry.dateKey === today) ?? null;
}

export default function MemeWarsSubmissionsPage() {
  const todayEntry = useMemo(() => getTodayEntry(), []);
  const todayDateKey = useMemo(() => getIstDateKey(), []);

  if (!todayEntry) {
    const isBeforeEvent = todayDateKey < MEME_WARS_SCHEDULE[0].dateKey;
    const isAfterEvent =
      todayDateKey > MEME_WARS_SCHEDULE[MEME_WARS_SCHEDULE.length - 1].dateKey;

    return (
      <>
        <PageHeader title="Meme Wars" />
        <div className="p-4">
          <EmptyState
            icon={<Swords className="h-10 w-10" />}
            title={
              isAfterEvent
                ? "Meme Wars is over!"
                : isBeforeEvent
                  ? "Meme Wars hasn't started yet"
                  : "No form available today"
            }
            description={
              isAfterEvent
                ? "Thanks for participating. Results will be announced soon."
                : isBeforeEvent
                  ? `Meme Wars begins on April 13. Stay tuned!`
                  : "Check back on an active Meme Wars day (April 13–17)."
            }
          />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Meme Wars" />

      <div className="space-y-3 p-4 pb-24">
        <Card className="space-y-1.5 border-primary-100 bg-primary-50 p-3">
          <p className="text-sm font-semibold text-primary-700">
            {todayEntry.label}
          </p>
          <p className="text-[11px] text-primary-700/90">
            Submit your memes via the Google Form below. One form per day.
          </p>
        </Card>

        <Card className="flex items-start gap-2.5 border-amber-200 bg-amber-50 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
          <div className="space-y-1">
            <p className="text-xs font-semibold text-amber-800">
              Important Guidelines
            </p>
            <p className="text-xs text-amber-800">
              Do <strong>NOT</strong> add any meme on{" "}
              <strong>CASHD</strong> and <strong>HCC</strong>. This is
              against the rules and will lead to disqualification.
            </p>
          </div>
        </Card>

        <a
          href={todayEntry.formUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <Button className="h-12 w-full text-base">
            <ExternalLink className="h-5 w-5" />
            Open {todayEntry.label} Form
          </Button>
        </a>

        <p className="text-center text-[11px] text-muted">
          Opens in a new tab. Make sure you are signed into your Google account.
        </p>
      </div>
    </>
  );
}

/* ==========================================================================
 * ORIGINAL MEME WARS SUBMISSIONS INFRASTRUCTURE (commented out for future use)
 * ==========================================================================
 *
 * import { useCallback, useEffect, useMemo, useRef, useState } from "react";
 * import { CalendarDays, ImagePlus } from "lucide-react";
 * import { Card } from "@/components/ui/card";
 * import { ConfirmDialog } from "@/components/ui/confirm-dialog";
 * import { EmptyState } from "@/components/ui/empty-state";
 * import { InlineRetry } from "@/components/ui/inline-retry";
 * import { ListSkeleton } from "@/components/ui/list-skeleton";
 * import { PullRefreshShell } from "@/components/ui/pull-refresh-shell";
 * import { useToast } from "@/components/ui/toast";
 * import { useAuth } from "@/modules/auth/auth-context";
 * import { SECTIONS } from "@/lib/constants";
 * import {
 *   clearUploadDraft,
 *   getIstDateKey,
 *   isSubmissionWindowClosed,
 *   readUploadDrafts,
 *   saveUploadDraft,
 *   buildUploadDraft,
 * } from "@/modules/meme-wars-submissions/services/meme-wars-submissions.service";
 * import {
 *   useDeleteMemeSlot,
 *   useMemeWarsSubmissions,
 *   useUploadMemeSlot,
 * } from "@/modules/meme-wars-submissions/hooks/useMemeWarsSubmissions";
 * import { MemeSlotCard } from "@/modules/meme-wars-submissions/components/meme-slot-card";
 * import {
 *   MEME_SLOT_NUMBERS,
 *   type MemeUploadDraft,
 *   type MemeSlotNumber,
 * } from "@/modules/meme-wars-submissions/types";
 * import type { SectionCode } from "@/types";
 *
 * const DRAFT_SOURCE_LIMIT_BYTES = 650_000;
 * const LOCAL_PREVIEW_MAX_AGE_MS = 120_000;
 *
 * interface LocalPreviewState {
 *   url: string;
 *   previousFileId: string | null;
 *   createdAtMs: number;
 * }
 *
 * function normalizeErrorMessage(error: unknown): string {
 *   if (error instanceof Error) {
 *     return error.message;
 *   }
 *   return "Something went wrong. Please try again.";
 * }
 *
 * function getUploadFailureToastMessage(message: string): string {
 *   if (message.includes("11:00 PM IST")) {
 *     return message;
 *   }
 *   const actionableMarkers = [
 *     "Only JPG, PNG, and WEBP",
 *     "5 MB",
 *     "Image is still too large",
 *     "We could not read that image",
 *     "Request timed out",
 *     "Could not reach Meme Wars service",
 *     "Your session has expired",
 *   ];
 *   if (actionableMarkers.some((marker) => message.includes(marker))) {
 *     return message;
 *   }
 *   return "We couldn't upload your meme. Please try again.";
 * }
 *
 * async function readSmallFileAsBase64(file: File): Promise<string | undefined> {
 *   if (file.size > DRAFT_SOURCE_LIMIT_BYTES) {
 *     return undefined;
 *   }
 *   return new Promise((resolve, reject) => {
 *     const reader = new FileReader();
 *     reader.onload = () => {
 *       const result = typeof reader.result === "string" ? reader.result : null;
 *       if (!result) { resolve(undefined); return; }
 *       const commaIndex = result.indexOf(",");
 *       resolve(commaIndex === -1 ? undefined : result.slice(commaIndex + 1));
 *     };
 *     reader.onerror = () => { reject(new Error("Failed to prepare upload draft.")); };
 *     reader.readAsDataURL(file);
 *   });
 * }
 *
 * // --- Original MemeWarsSubmissionsPage component with full slot-based
 * // --- upload/delete infrastructure was here. All hooks, services, and
 * // --- components under src/modules/meme-wars-submissions/ are preserved
 * // --- and can be restored by uncommenting this block and removing the
 * // --- Google Forms version above.
 * ========================================================================== */
