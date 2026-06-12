"use client";

import { memo, useCallback, useDeferredValue, useState } from "react";
import Link from "next/link";
import { Shield, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { ClearSearchButton } from "@/components/ui/clear-search-button";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineRetry } from "@/components/ui/inline-retry";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { PullRefreshShell } from "@/components/ui/pull-refresh-shell";
import { SearchInput } from "@/components/ui/search-input";
import { SearchStatusHint } from "@/components/ui/search-status-hint";
import { useAuth } from "@/modules/auth/auth-context";
import { useStudents } from "@/modules/students/hooks/useStudents";
import { getLoadErrorCopy, getSearchHintCopy } from "@/lib/ux-copy";
import { getInitials, timeAgo } from "@/lib/utils";
import type { Profile } from "@/types";

export default function StudentsPage() {
  const { role } = useAuth();
  const isAdmin = role === "admin";

  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const normalizedSearch = deferredSearch.trim();
  const isSearching = search !== deferredSearch;

  const searchFilters = normalizedSearch ? { search: normalizedSearch } : undefined;

  const adminsQuery = useStudents(
    isAdmin ? { ...searchFilters, role: "admin" as const } : undefined,
  );

  const studentsQuery = useStudents({
    ...searchFilters,
    role: "student" as const,
  });

  const onRefresh = useCallback(async () => {
    await Promise.allSettled([
      studentsQuery.refetch(),
      ...(isAdmin ? [adminsQuery.refetch()] : []),
    ]);
  }, [studentsQuery, adminsQuery, isAdmin]);

  const hasSearchQuery = normalizedSearch.length > 0;
  const isLoading = studentsQuery.isLoading || (isAdmin && adminsQuery.isLoading);
  const isFetching = studentsQuery.isFetching || (isAdmin && adminsQuery.isFetching);
  const isError = studentsQuery.isError || (isAdmin && adminsQuery.isError);
  const showSearchHint = hasSearchQuery && (isSearching || isFetching);

  const admins = isAdmin ? adminsQuery.data : undefined;
  const students = studentsQuery.data;
  const dataUpdatedAt = Math.max(
    studentsQuery.dataUpdatedAt,
    isAdmin ? adminsQuery.dataUpdatedAt : 0,
  );
  const isEmpty = !students?.length && (!isAdmin || !admins?.length);

  return (
    <>
      <PageHeader title="Students" showBack />

      <PullRefreshShell onRefresh={onRefresh}>
        <div className="space-y-3 p-4">
          <SearchInput
            placeholder="Enter a name, email, or PG ID"
            value={search}
            onChange={setSearch}
            isSearching={isSearching}
            onClear={() => setSearch("")}
          />

          {dataUpdatedAt > 0 && (
            <p className="text-[10px] text-muted">
              Updated {timeAgo(new Date(dataUpdatedAt).toISOString())}
            </p>
          )}

          <SearchStatusHint
            isActive={showSearchHint}
            label={getSearchHintCopy("students")}
          />

          {isLoading ? (
            <ListSkeleton
              rowHeightClassName="h-16"
              searching={showSearchHint}
              searchingLabel={getSearchHintCopy("students")}
            />
          ) : isError ? (
            <InlineRetry
              message={getLoadErrorCopy("students")}
              onRetry={() => {
                studentsQuery.refetch();
                if (isAdmin) adminsQuery.refetch();
              }}
            />
          ) : isEmpty ? (
            <EmptyState
              icon={<Users className="h-10 w-10" />}
              title="No students found"
              description={
                normalizedSearch ? "Try a different search term" : "No students have been added yet"
              }
              action={
                normalizedSearch ? (
                  <ClearSearchButton onClear={() => setSearch("")} />
                ) : undefined
              }
            />
          ) : (
            <div className="space-y-4">
              {/* Admin section — only visible to admins */}
              {isAdmin && admins && admins.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-amber-600" />
                    <p className="text-xs font-medium text-amber-600">
                      Admins ({admins.length})
                    </p>
                  </div>
                  {admins.map((admin) => (
                    <StudentRow key={admin.id} student={admin} />
                  ))}
                </div>
              )}

              {/* Students section */}
              {students && students.length > 0 && (
                <div className="space-y-3">
                  {isAdmin && (
                    <p className="text-xs font-medium text-muted">
                      Students ({students.length})
                    </p>
                  )}
                  {!isAdmin && (
                    <p className="text-xs text-muted">
                      {students.length} student{students.length !== 1 ? "s" : ""}
                    </p>
                  )}
                  {students.map((student) => (
                    <StudentRow key={student.id} student={student} />
                  ))}
                  {studentsQuery.hasNextPage && (
                    <button
                      onClick={() => studentsQuery.fetchNextPage()}
                      disabled={studentsQuery.isFetchingNextPage}
                      className="w-full rounded-xl bg-gray-100 py-3 text-sm font-medium text-muted transition-colors active:bg-gray-200 disabled:opacity-50"
                    >
                      {studentsQuery.isFetchingNextPage ? "Loading..." : "Load more"}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </PullRefreshShell>
    </>
  );
}

const StudentRow = memo(function StudentRow({ student }: { student: Profile }) {
  return (
    <Link href={`/students/${student.id}`} className="block">
      <Card interactive className="ui-content-auto flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-600">
          {getInitials(student.full_name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {student.full_name}
          </p>
          <p className="truncate text-xs text-muted">{student.email}</p>
        </div>
      </Card>
    </Link>
  );
});
