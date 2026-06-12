"use client";

import { memo, useCallback, useDeferredValue, useMemo, useState } from "react";
import { Bell } from "lucide-react";
import { format } from "date-fns";
import { PageHeader } from "@/components/layout/page-header";
import { FloatingActionButton } from "@/components/ui/fab";
import { Card } from "@/components/ui/card";
import { ClearSearchButton } from "@/components/ui/clear-search-button";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineRetry } from "@/components/ui/inline-retry";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { StatusBadge } from "@/components/ui/badge";
import { PullRefreshShell } from "@/components/ui/pull-refresh-shell";
import { RefreshBar } from "@/components/ui/refresh-bar";
import { SearchInput } from "@/components/ui/search-input";
import { SearchStatusHint } from "@/components/ui/search-status-hint";
import {
  useNotifications,
  useMyNotifications,
} from "@/modules/notifications/hooks/useNotifications";
import { useAuth } from "@/modules/auth/auth-context";
import { getLoadErrorCopy, getSearchHintCopy } from "@/lib/ux-copy";
import type { Notification, NotificationStatus } from "@/types";

type AlertNotification = Notification & { creator?: { full_name: string } };

const STATUS_VARIANT: Record<NotificationStatus, "success" | "warning" | "error" | "muted"> = {
  draft: "muted",
  scheduled: "warning",
  sending: "warning",
  sent: "success",
  failed: "error",
};

// Accent bar color by status
const ACCENT_COLOR: Record<NotificationStatus, string> = {
  draft: "var(--color-muted)",
  scheduled: "var(--color-brand-gold)",
  sending: "var(--color-brand-gold)",
  sent: "var(--color-primary-500)",
  failed: "var(--color-error)",
};

type FilterChip = "all" | "sent" | "scheduled" | "failed";
const FILTER_CHIPS: { value: FilterChip; label: string }[] = [
  { value: "all", label: "All" },
  { value: "sent", label: "Sent" },
  { value: "scheduled", label: "Scheduled" },
  { value: "failed", label: "Failed" },
];

export default function AlertsPage() {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterChip>("all");
  const deferredSearch = useDeferredValue(search);
  const normalizedSearch = deferredSearch.trim().toLowerCase();
  const isSearching = search !== deferredSearch;

  const adminQuery = useNotifications();
  const studentQuery = useMyNotifications();
  const activeQuery = isAdmin ? adminQuery : studentQuery;

  const notifications = activeQuery.data;
  const isLoading = activeQuery.isLoading;
  const isFetching = activeQuery.isFetching;
  const isError = activeQuery.isError;
  const refetch = activeQuery.refetch;
  const hasNextPage = activeQuery.hasNextPage;
  const fetchNextPage = activeQuery.fetchNextPage;
  const isFetchingNextPage = activeQuery.isFetchingNextPage;

  const onRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const filteredNotifications = useMemo(() => {
    if (!notifications) return notifications;

    let result = notifications;

    // Status filter (admin only)
    if (isAdmin && statusFilter !== "all") {
      result = result.filter((notif) => notif.status === statusFilter);
    }

    // Search filter
    if (normalizedSearch) {
      result = result.filter((notif) => {
        const haystack = `${notif.title} ${notif.body}`.toLowerCase();
        return haystack.includes(normalizedSearch);
      });
    }

    return result;
  }, [notifications, normalizedSearch, isAdmin, statusFilter]);

  const countLabel = filteredNotifications?.length ?? 0;
  const hasSearchQuery = normalizedSearch.length > 0;
  const showSearchHint = hasSearchQuery && (isSearching || isFetching);

  return (
    <>
      <PageHeader title="Alerts" />
      <RefreshBar visible={isFetching && !isLoading} />

      <PullRefreshShell onRefresh={onRefresh}>
        <div className="space-y-3 p-4 pb-24">
          <SearchInput
            placeholder="Search alerts..."
            value={search}
            onChange={setSearch}
            isSearching={isSearching}
            onClear={() => setSearch("")}
          />

          {/* Admin filter chips */}
          {isAdmin && (
            <div className="flex gap-2 overflow-x-auto scrollbar-none">
              {FILTER_CHIPS.map((chip) => (
                <button
                  key={chip.value}
                  onClick={() => setStatusFilter(chip.value)}
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    statusFilter === chip.value
                      ? "bg-primary-500 text-white"
                      : "bg-surface-alt text-muted"
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          )}

          {/* Section header with inline count */}
          {!isLoading && !isError && !!countLabel && (
            <p className="text-xs font-medium text-muted">
              Alerts <span className="font-normal">&middot; {countLabel}</span>
            </p>
          )}

          <SearchStatusHint
            isActive={showSearchHint}
            label={getSearchHintCopy("alerts")}
          />

          {isLoading ? (
            <ListSkeleton
              rowHeightClassName="h-20"
              searching={showSearchHint}
              searchingLabel={getSearchHintCopy("alerts")}
            />
          ) : isError ? (
            <InlineRetry
              message={getLoadErrorCopy("alerts")}
              onRetry={() => refetch()}
            />
          ) : !filteredNotifications?.length ? (
            <EmptyState
              icon={<Bell className="h-10 w-10" />}
              title={normalizedSearch ? "No matching alerts" : "No notifications"}
              description={
                normalizedSearch
                  ? "Try a different search term"
                  : isAdmin
                    ? "Create a notification to get started"
                    : "You're all caught up"
              }
              action={
                normalizedSearch ? (
                  <ClearSearchButton onClear={() => setSearch("")} />
                ) : undefined
              }
            />
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notif: AlertNotification) => (
                <AlertCard key={notif.id} notif={notif} isAdmin={isAdmin} />
              ))}
              {hasNextPage && !normalizedSearch && (
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="w-full rounded-xl bg-surface-alt py-3 text-sm font-medium text-muted transition-colors active:bg-gray-200 disabled:opacity-50"
                >
                  {isFetchingNextPage ? "Loading..." : "Load more"}
                </button>
              )}
            </div>
          )}
        </div>
      </PullRefreshShell>

      {isAdmin && <FloatingActionButton href="/alerts/create" />}
    </>
  );
}

const AlertCard = memo(function AlertCard({
  notif,
  isAdmin,
}: {
  notif: AlertNotification;
  isAdmin: boolean;
}) {
  const author = notif.creator?.full_name ?? notif.created_by;
  const formattedDate = format(new Date(notif.created_at), "MMM d, yyyy, h:mm a");
  const accentColor = ACCENT_COLOR[notif.status] ?? "var(--color-border)";

  return (
    <Card className="!p-0 overflow-hidden">
      <div className="flex">
        {/* Left accent bar */}
        <div
          className="w-1 shrink-0 self-stretch rounded-l-2xl"
          style={{ backgroundColor: accentColor }}
        />

        {/* Content */}
        <div className="flex-1 space-y-1.5 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="min-w-0 truncate text-sm font-semibold text-foreground">
              {notif.title}
            </h3>
            {isAdmin && (
              <StatusBadge
                status={notif.status}
                variant={STATUS_VARIANT[notif.status]}
              />
            )}
          </div>

          <p className="line-clamp-2 text-sm text-muted">
            {notif.body}
          </p>

          <p className="text-xs text-muted">
            {isAdmin && author ? `${author} · ` : ""}
            {formattedDate}
          </p>

          {isAdmin && notif.status === "scheduled" && notif.scheduled_at && (
            <p className="text-xs text-brand-gold">
              Scheduled for {format(new Date(notif.scheduled_at), "MMM d, yyyy, h:mm a")}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
});
