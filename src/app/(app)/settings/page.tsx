"use client";

import { useCallback, useDeferredValue, useMemo, useState } from "react";
import { Shield } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { ClearSearchButton } from "@/components/ui/clear-search-button";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineRetry } from "@/components/ui/inline-retry";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { PullRefreshShell } from "@/components/ui/pull-refresh-shell";
import { SearchInput } from "@/components/ui/search-input";
import { StatusBadge } from "@/components/ui/badge";
import { useAdmins } from "@/modules/admin/hooks/useAdmin";
import { useAuth } from "@/modules/auth/auth-context";
import { getInitials, timeAgo } from "@/lib/utils";

export default function SettingsPage() {
  const { profile } = useAuth();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const normalizedSearch = deferredSearch.trim().toLowerCase();
  const isSearching = search !== deferredSearch;

  const { data: admins, isLoading, isError, error, refetch, dataUpdatedAt } = useAdmins();

  const onRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const refreshedLabel =
    dataUpdatedAt > 0 ? `Updated ${timeAgo(new Date(dataUpdatedAt).toISOString())}` : null;

  const filteredAdmins = useMemo(() => {
    if (!admins) return admins;
    if (!normalizedSearch) return admins;

    return admins.filter((admin) => {
      const haystack = `${admin.full_name} ${admin.email}`.toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [admins, normalizedSearch]);

  const countLabel = filteredAdmins?.length ?? 0;

  return (
    <>
      <PageHeader title="Settings" showBack />

      <PullRefreshShell onRefresh={onRefresh}>
        <div className="space-y-4 p-4">
          {/* Current user card */}
          {profile && (
            <Card className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-600">
                {getInitials(profile.full_name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {profile.full_name}
                </p>
                <p className="truncate text-xs text-muted">{profile.email}</p>
              </div>
              <StatusBadge
                status={profile.role}
                variant={profile.role === "admin" ? "warning" : "muted"}
              />
            </Card>
          )}

          {/* Admin list */}
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">
              Admins
            </h2>

            <SearchInput
              placeholder="Enter an admin name or email"
              value={search}
              onChange={setSearch}
              isSearching={isSearching}
              onClear={() => setSearch("")}
            />

            {refreshedLabel && <p className="text-[10px] text-muted">{refreshedLabel}</p>}

            {!!countLabel && (
              <p className="text-xs text-muted">
                {countLabel} admin{countLabel !== 1 ? "s" : ""}
              </p>
            )}

            {isLoading ? (
              <ListSkeleton
                rows={3}
                rowHeightClassName="h-20"
                searching={normalizedSearch.length > 0 && isSearching}
                searchingLabel="Filtering admins..."
              />
            ) : isError ? (
              <InlineRetry
                message={error instanceof Error ? error.message : "Could not load admins"}
                onRetry={() => refetch()}
              />
            ) : !filteredAdmins?.length ? (
              <EmptyState
                icon={<Shield className="h-10 w-10" />}
                title={normalizedSearch ? "No matching admins" : "No admins"}
                description={
                  normalizedSearch
                    ? "Try a different search term"
                    : "No admin users found"
                }
                action={
                  normalizedSearch ? (
                    <ClearSearchButton onClear={() => setSearch("")} />
                  ) : undefined
                }
              />
            ) : (
              filteredAdmins.map((admin) => (
                <Card key={admin.id} className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-semibold text-amber-700">
                    {getInitials(admin.full_name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {admin.full_name}
                    </p>
                    <p className="truncate text-xs text-muted">{admin.email}</p>
                    {admin.promoted_at && (
                      <p className="text-xs text-muted">
                        Promoted {timeAgo(admin.promoted_at)}
                      </p>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </PullRefreshShell>
    </>
  );
}
