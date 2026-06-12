"use client";

import { memo } from "react";
import Link from "next/link";
import { MapPin, Clock, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { formatDate, formatTime, formatDuration } from "@/lib/utils";
import { getVenueDetails } from "@/modules/events/venue-metadata";
import type { Event } from "@/types";

export type EventCardVariant = "ongoing" | "upcoming" | "completed";

interface EventCardProps {
  event: Event;
  variant?: EventCardVariant;
  showDate?: boolean;
}

function EventCardBase({ event, variant, showDate }: EventCardProps) {
  const duration = formatDuration(event.starts_at, event.ends_at);
  const venueLabel = getVenueDetails(event.venue)?.name ?? event.venue;

  const accentClass =
    variant === "ongoing"
      ? "border-l-[3px] border-l-success"
      : variant === "completed"
        ? "opacity-60"
        : "";

  return (
    <Link href={`/events/${event.id}`} className="block">
      <Card interactive className={`ui-content-auto ${accentClass}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1.5">
            {/* Title */}
            <div className="flex items-center gap-2">
              <h3 className="truncate text-base font-semibold text-foreground">
                {event.title}
              </h3>
              {event.is_cancelled && (
                <StatusBadge status="Cancelled" variant="error" />
              )}
            </div>

            {/* Time + duration */}
            <div className="flex items-center gap-2 text-xs text-muted">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>
                {showDate ? `${formatDate(event.starts_at)} · ` : ""}
                {formatTime(event.starts_at)}
                {event.ends_at ? ` - ${formatTime(event.ends_at)}` : ""}
              </span>
              {duration && (
                <span className="rounded-full bg-primary-50 px-1.5 py-0.5 text-[10px] font-medium text-primary-600">
                  {duration}
                </span>
              )}
            </div>

            {/* Venue */}
            {venueLabel && (
              <div className="flex items-center gap-1.5 text-xs text-muted">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{venueLabel}</span>
              </div>
            )}
          </div>

          <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted" />
        </div>
      </Card>
    </Link>
  );
}

export const EventCard = memo(EventCardBase);
