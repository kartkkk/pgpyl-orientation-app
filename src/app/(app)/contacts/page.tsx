"use client";

import { useCallback, useDeferredValue, useMemo, useState } from "react";
import { BookOpen, Mail, Phone as PhoneIcon } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { ClearSearchButton } from "@/components/ui/clear-search-button";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineRetry } from "@/components/ui/inline-retry";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { PullRefreshShell } from "@/components/ui/pull-refresh-shell";
import { RefreshBar } from "@/components/ui/refresh-bar";
import { SearchInput } from "@/components/ui/search-input";
import { useContacts } from "@/modules/contacts/hooks/useContacts";
import { timeAgo } from "@/lib/utils";

export default function ContactsPage() {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const normalizedSearch = deferredSearch.trim().toLowerCase();
  const isSearching = search !== deferredSearch;

  const { data: contacts, isLoading, isFetching, isError, error, refetch, dataUpdatedAt } = useContacts();

  const onRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const refreshedLabel =
    dataUpdatedAt > 0 ? `Updated ${timeAgo(new Date(dataUpdatedAt).toISOString())}` : null;

  const filteredContacts = useMemo(() => {
    if (!contacts) return contacts;
    if (!normalizedSearch) return contacts;

    return contacts.filter((contact) => {
      const haystack = `${contact.body_name} ${contact.poc_name} ${contact.phone_number ?? ""} ${contact.email ?? ""}`.toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [contacts, normalizedSearch]);

  const countLabel = filteredContacts?.length ?? 0;

  return (
    <>
      <PageHeader title="Contacts" showBack />
      <RefreshBar visible={isFetching && !isLoading} />

      <PullRefreshShell onRefresh={onRefresh}>
        <div className="space-y-3 p-4">
          <SearchInput
            placeholder="Enter a contact name"
            value={search}
            onChange={setSearch}
            isSearching={isSearching}
            onClear={() => setSearch("")}
          />

          {refreshedLabel && <p className="text-[10px] text-muted">{refreshedLabel}</p>}

          {!!countLabel && (
            <p className="text-xs text-muted">
              {countLabel} contact{countLabel !== 1 ? "s" : ""}
            </p>
          )}

          {isLoading ? (
            <ListSkeleton
              rows={4}
              rowHeightClassName="h-24"
              searching={normalizedSearch.length > 0 && isSearching}
              searchingLabel="Filtering contacts..."
            />
          ) : isError ? (
            <InlineRetry
              message={error instanceof Error ? error.message : "Could not load contacts"}
              onRetry={() => refetch()}
            />
          ) : !filteredContacts?.length ? (
            <EmptyState
              icon={<BookOpen className="h-10 w-10" />}
              title={normalizedSearch ? "No matching contacts" : "No contacts"}
              description={
                normalizedSearch
                  ? "Try a different search term"
                  : "No important contacts have been added yet"
              }
              action={
                normalizedSearch ? (
                  <ClearSearchButton onClear={() => setSearch("")} />
                ) : undefined
              }
            />
          ) : (
            filteredContacts.map((contact) => (
              <Card key={contact.id} className="space-y-2">
                <div>
                  <p className="text-xs font-medium text-primary-500 uppercase tracking-wide">
                    {contact.body_name}
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {contact.poc_name}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {contact.phone_number && (
                    <a
                      href={`tel:${contact.phone_number}`}
                      className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-2 text-sm text-foreground active:bg-gray-100 min-h-[44px]"
                    >
                      <PhoneIcon className="h-4 w-4 text-muted" />
                      {contact.phone_number}
                    </a>
                  )}
                  {contact.email && (
                    <a
                      href={`mailto:${contact.email}`}
                      className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-2 text-sm text-foreground active:bg-gray-100 min-h-[44px]"
                    >
                      <Mail className="h-4 w-4 text-muted" />
                      {contact.email}
                    </a>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </PullRefreshShell>
    </>
  );
}
