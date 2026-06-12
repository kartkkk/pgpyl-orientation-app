"use client";

import { useCallback, useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import {
  ExternalLink,
  FileText,
  BookOpen,
  MapPin,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { ClearSearchButton } from "@/components/ui/clear-search-button";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineRetry } from "@/components/ui/inline-retry";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { PullRefreshShell } from "@/components/ui/pull-refresh-shell";
import { SearchInput } from "@/components/ui/search-input";
import { useDocuments, useMyDocuments } from "@/modules/documents/hooks/useDocuments";
import { useAuth } from "@/modules/auth/auth-context";
import { timeAgo } from "@/lib/utils";
import { buildSearchIndex } from "@/modules/documents/kt-data";

// ─── Search Indexes (built once) ───

const ktSearchIndex = buildSearchIndex();

// ─── Resource Hub Cards ───

interface HubCard {
  href: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  iconColor: string;
  ready: boolean;
}

const HUB_CARDS: HubCard[] = [
  {
    href: "/documents/kt",
    label: "KT Guide",
    description: "Campus life, operations, contacts and practical tips",
    icon: BookOpen,
    gradient: "from-primary-50 to-blue-50",
    iconColor: "text-primary-500",
    ready: true,
  },
  {
    href: "/documents/map",
    label: "ISB Campus Map",
    description: "Navigate the campus — buildings, SVs, facilities",
    icon: MapPin,
    gradient: "from-emerald-50 to-green-50",
    iconColor: "text-emerald-600",
    ready: true,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

function ResourceHubCards() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-2.5"
    >
      {HUB_CARDS.map((card) => (
        <motion.div key={card.href} variants={cardVariants}>
          <Link href={card.href}>
            <motion.div whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
              <Card
                interactive
                className={`relative overflow-hidden bg-gradient-to-r ${card.gradient}`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/80 shadow-sm">
                    <card.icon className={`h-5.5 w-5.5 ${card.iconColor}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">
                        {card.label}
                      </h3>
                      {!card.ready && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-muted">
                          Coming Soon
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted leading-relaxed line-clamp-2">
                      {card.description}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
                </div>
              </Card>
            </motion.div>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
}

// ─── KT Search Results ───

function KTSearchResultsList({ query }: { query: string }) {
  const results = useMemo(() => {
    if (!query) return [];
    return ktSearchIndex.filter((entry) => entry.text.includes(query));
  }, [query]);

  if (results.length === 0) return null;

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
        KT Guide
      </p>
      {results.map((r) => (
        <Link
          key={r.subsectionId}
          href={`/documents/kt?section=${r.sectionId}&sub=${r.subsectionId}`}
        >
          <Card interactive className="flex items-center gap-3 my-1">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50">
              <BookOpen className="h-4 w-4 text-primary-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {r.subsectionTitle}
              </p>
              <p className="text-xs text-muted">
                {r.sectionEmoji} {r.sectionTitle}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
          </Card>
        </Link>
      ))}
    </div>
  );
}

// ─── Main Page ───

export default function DocumentsPage() {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const normalizedSearch = deferredSearch.trim().toLowerCase();
  const isSearching = search !== deferredSearch;

  const allDocs = useDocuments(undefined);
  const myDocs = useMyDocuments();
  const activeQuery = isAdmin ? allDocs : myDocs;

  const documents = activeQuery.data;
  const isLoading = activeQuery.isLoading;
  const isError = activeQuery.isError;
  const error = activeQuery.error;
  const dataUpdatedAt = activeQuery.dataUpdatedAt;
  const refetch = activeQuery.refetch;

  const onRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const refreshedLabel =
    dataUpdatedAt > 0 ? `Updated ${timeAgo(new Date(dataUpdatedAt).toISOString())}` : null;

  const filteredDocuments = useMemo(() => {
    if (!documents) return documents;
    if (!normalizedSearch) return documents;

    return documents.filter((doc) => {
      const haystack = `${doc.title} ${doc.description ?? ""}`.toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [documents, normalizedSearch]);

  const hasSearchQuery = normalizedSearch.length > 0;
  const hasKtResults = hasSearchQuery && ktSearchIndex.some((e) => e.text.includes(normalizedSearch));
  const hasDocResults = (filteredDocuments?.length ?? 0) > 0;
  const hasAnyResults = hasKtResults || hasDocResults;

  return (
    <>
      <PageHeader title="Resources" />

      <PullRefreshShell onRefresh={onRefresh}>
        <div className="space-y-3 p-4">
          {/* Search bar right below the header */}
          <SearchInput
            placeholder="Search Resources"
            value={search}
            onChange={setSearch}
            isSearching={isSearching}
            onClear={() => setSearch("")}
          />

          {/* When searching — show results */}
          {hasSearchQuery ? (
            <div className="space-y-4">
              {!hasAnyResults && !isLoading && (
                <EmptyState
                  icon={<FileText className="h-10 w-10" />}
                  title="No matching results"
                  description="Try a different search term"
                  action={<ClearSearchButton onClear={() => setSearch("")} />}
                />
              )}

              {/* KT results */}
              <KTSearchResultsList query={normalizedSearch} />

              {/* Admin-uploaded doc results */}
              {hasDocResults && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                    Uploaded Resources
                  </p>
                  {filteredDocuments!.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Card interactive className="flex items-start gap-3">
                        <FileText className="mt-0.5 h-5 w-5 shrink-0 text-primary-500" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">
                            {doc.title}
                          </p>
                          {doc.description && (
                            <p className="mt-0.5 line-clamp-2 text-xs text-muted">
                              {doc.description}
                            </p>
                          )}
                          <p className="mt-1.5 text-xs text-muted">
                            {timeAgo(doc.created_at)}
                          </p>
                        </div>
                        <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                      </Card>
                    </a>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Resource Hub Cards */}
              <ResourceHubCards />

              {/* Admin-uploaded documents list (no search active) */}
              {(isLoading || (documents?.length ?? 0) > 0) && (
                <div className="space-y-2 pt-1">
                  {refreshedLabel && (
                    <p className="text-[10px] text-muted">{refreshedLabel}</p>
                  )}

                  {isLoading ? (
                    <ListSkeleton
                      rows={3}
                      rowHeightClassName="h-20"
                      searching={false}
                      searchingLabel="Loading resources..."
                    />
                  ) : isError ? (
                    <InlineRetry
                      message={
                        error instanceof Error
                          ? error.message
                          : "Could not load resources"
                      }
                      onRetry={() => refetch()}
                    />
                  ) : (
                    documents?.map((doc) => (
                      <a
                        key={doc.id}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Card interactive className="flex items-start gap-3">
                          <FileText className="mt-0.5 h-5 w-5 shrink-0 text-primary-500" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">
                              {doc.title}
                            </p>
                            {doc.description && (
                              <p className="mt-0.5 line-clamp-2 text-xs text-muted">
                                {doc.description}
                              </p>
                            )}
                            <p className="mt-1.5 text-xs text-muted">
                              {timeAgo(doc.created_at)}
                            </p>
                          </div>
                          <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                        </Card>
                      </a>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </PullRefreshShell>
    </>
  );
}
