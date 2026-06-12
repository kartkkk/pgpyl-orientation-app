"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { startOfDay, addDays, isBefore, isAfter, parseISO, format } from "date-fns";
import { PageHeader } from "@/components/layout/page-header";
import { FloatingActionButton } from "@/components/ui/fab";
import { ClearSearchButton } from "@/components/ui/clear-search-button";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineRetry } from "@/components/ui/inline-retry";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { PullRefreshShell } from "@/components/ui/pull-refresh-shell";
import { RefreshBar } from "@/components/ui/refresh-bar";
import { SearchStatusHint } from "@/components/ui/search-status-hint";
import { CalendarStrip } from "@/modules/events/components/calendar-strip";
import { EventAccordion } from "@/modules/events/components/event-accordion";
import { EventCard } from "@/modules/events/components/event-card";
import { useEvents } from "@/modules/events/hooks/useEvents";
import { useAuth } from "@/modules/auth/auth-context";
import { getLoadErrorCopy, getSearchHintCopy } from "@/lib/ux-copy";
import { timeAgo } from "@/lib/utils";
import type { EventFilters } from "@/modules/events/types";
import type { Event } from "@/types";

export default function EventsPage() {
  const { role } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const normalizedSearch = deferredSearch.trim();
  const isSearching = search !== deferredSearch;
  const hasSearchQuery = normalizedSearch.length > 0;

  // Re-group events when an event boundary is crossed (starts or ends)
  const [, setBoundaryTick] = useState(0);
  const nextBoundaryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // When searching: fetch across all days. Otherwise: fetch for selected day.
  const filters: EventFilters = useMemo(() => {
    if (hasSearchQuery) {
      return { search: normalizedSearch, upcoming: true };
    }
    const dayStart = startOfDay(selectedDate);
    const dayEnd = startOfDay(addDays(selectedDate, 1));
    return {
      dateFrom: dayStart.toISOString(),
      dateTo: dayEnd.toISOString(),
    };
  }, [selectedDate, normalizedSearch, hasSearchQuery]);

  const { data: events, isLoading, isFetching, isError, refetch, dataUpdatedAt } =
    useEvents(filters);

  const onRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const showSearchHint = hasSearchQuery && (isSearching || isFetching);

  // Group events into ongoing / upcoming / completed (only for day view)
  const { ongoing, upcoming, completed } = (() => {
    const empty = { ongoing: [] as Event[], upcoming: [] as Event[], completed: [] as Event[] };
    if (!events || hasSearchQuery) return empty;

    const now = new Date();
    const todayStart = startOfDay(now);
    const selectedStart = startOfDay(selectedDate);

    if (isBefore(selectedStart, todayStart)) {
      return { ongoing: [], upcoming: [], completed: events as Event[] };
    }

    if (isAfter(selectedStart, todayStart)) {
      return { ongoing: [], upcoming: events as Event[], completed: [] };
    }

    // Today — categorize by time
    const ongoingEvents: Event[] = [];
    const upcomingEvents: Event[] = [];
    const completedEvents: Event[] = [];

    for (const event of events as Event[]) {
      const startsAt = parseISO(event.starts_at);
      const endsAt = event.ends_at ? parseISO(event.ends_at) : null;

      if (startsAt <= now && (endsAt === null || endsAt > now)) {
        ongoingEvents.push(event);
      } else if (startsAt > now) {
        upcomingEvents.push(event);
      } else {
        completedEvents.push(event);
      }
    }

    return { ongoing: ongoingEvents, upcoming: upcomingEvents, completed: completedEvents };
  })();

  // Schedule a re-render at the next event boundary (when an event starts or ends)
  useEffect(() => {
    if (nextBoundaryRef.current) clearTimeout(nextBoundaryRef.current);

    if (!events || hasSearchQuery) return;

    const todayStart = startOfDay(new Date());
    const selectedStart = startOfDay(selectedDate);
    if (selectedStart.getTime() !== todayStart.getTime()) {
      // Not viewing today — categories are static (all upcoming or all completed)
      return;
    }

    const now = Date.now();
    let nearest = Infinity;
    for (const event of events as Event[]) {
      const startMs = parseISO(event.starts_at).getTime();
      const endMs = event.ends_at ? parseISO(event.ends_at).getTime() : null;
      if (startMs > now && startMs < nearest) nearest = startMs;
      if (endMs && endMs > now && endMs < nearest) nearest = endMs;
    }

    if (nearest === Infinity) return;

    // Add 1s buffer so the boundary has clearly passed
    const delay = nearest - now + 1000;
    nextBoundaryRef.current = setTimeout(() => setBoundaryTick((t) => t + 1), delay);

    return () => {
      if (nextBoundaryRef.current) clearTimeout(nextBoundaryRef.current);
    };
  }, [events, selectedDate, hasSearchQuery]);

  const noEventsAtAll =
    !hasSearchQuery && ongoing.length === 0 && upcoming.length === 0 && completed.length === 0;

  return (
    <>
      <PageHeader title="Events" />
      <RefreshBar visible={isFetching && !isLoading} />
      <CalendarStrip
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        search={search}
        onSearchChange={setSearch}
      />

      <PullRefreshShell onRefresh={onRefresh}>
        <div className="space-y-3 p-4">
          {dataUpdatedAt > 0 && !hasSearchQuery && (
            <p className="text-[10px] text-muted">
              Updated {timeAgo(new Date(dataUpdatedAt).toISOString())}
            </p>
          )}

          <SearchStatusHint
            isActive={showSearchHint}
            label={getSearchHintCopy("events")}
          />

          {isLoading ? (
            <ListSkeleton
              searching={showSearchHint}
              searchingLabel={getSearchHintCopy("events")}
            />
          ) : isError ? (
            <InlineRetry
              message={getLoadErrorCopy("events")}
              onRetry={() => refetch()}
            />
          ) : hasSearchQuery ? (
            // Search results — flat list across all days
            !events?.length ? (
              <EmptyState
                title="No events found"
                description="Try a different search term"
                action={<ClearSearchButton onClear={() => setSearch("")} />}
              />
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-muted">
                  {events.length} result{events.length !== 1 ? "s" : ""}
                </p>
                {(events as Event[]).map((e) => (
                  <EventCard key={e.id} event={e} showDate />
                ))}
              </div>
            )
          ) : noEventsAtAll ? (
            <EmptyState
              title="No events"
              description={`Nothing scheduled for ${format(selectedDate, "MMMM d")}`}
            />
          ) : (
            <>
              {ongoing.length > 0 && (
                <EventAccordion title="Ongoing" count={ongoing.length} variant="ongoing">
                  {ongoing.map((e) => (
                    <EventCard key={e.id} event={e} variant="ongoing" />
                  ))}
                </EventAccordion>
              )}
              {upcoming.length > 0 && (
                <EventAccordion title="Upcoming" count={upcoming.length} variant="upcoming">
                  {upcoming.map((e) => (
                    <EventCard key={e.id} event={e} variant="upcoming" />
                  ))}
                </EventAccordion>
              )}
              {completed.length > 0 && (
                <EventAccordion title="Completed" count={completed.length} variant="completed">
                  {completed.map((e) => (
                    <EventCard key={e.id} event={e} variant="completed" />
                  ))}
                </EventAccordion>
              )}
            </>
          )}
        </div>
      </PullRefreshShell>

      {role === "admin" && <FloatingActionButton href="/events/create" />}
    </>
  );
}
