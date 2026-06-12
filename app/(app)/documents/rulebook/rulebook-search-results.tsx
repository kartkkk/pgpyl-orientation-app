"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { ClearSearchButton } from "@/components/ui/clear-search-button";
import { KTSectionContent } from "../kt/kt-section-content";
import { RULEBOOK_SECTIONS, buildRulebookSearchIndex } from "@/modules/documents/rulebook-data";

const searchIndex = buildRulebookSearchIndex();

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.03 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

export function RulebookSearchResults({
  query,
  onClear,
}: {
  query: string;
  onClear: () => void;
}) {
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const matched = searchIndex.filter((entry) => entry.text.includes(q));

    // Group matched subsections by section
    const grouped: {
      sectionId: string;
      sectionTitle: string;
      sectionEmoji: string;
      subsectionIds: Set<string>;
    }[] = [];

    for (const m of matched) {
      let group = grouped.find((g) => g.sectionId === m.sectionId);
      if (!group) {
        group = {
          sectionId: m.sectionId,
          sectionTitle: m.sectionTitle,
          sectionEmoji: m.sectionEmoji,
          subsectionIds: new Set(),
        };
        grouped.push(group);
      }
      group.subsectionIds.add(m.subsectionId);
    }

    return grouped;
  }, [query]);

  const totalMatches = results.reduce(
    (acc, g) => acc + g.subsectionIds.size,
    0,
  );

  if (results.length === 0) {
    return (
      <EmptyState
        icon={<Search className="h-10 w-10" />}
        title="No matching results"
        description="Try a different search term"
        action={<ClearSearchButton onClear={onClear} />}
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">
        {totalMatches} result{totalMatches !== 1 ? "s" : ""} across{" "}
        {results.length} section{results.length !== 1 ? "s" : ""}
      </p>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-5"
      >
        {results.map((group) => {
          const section = RULEBOOK_SECTIONS.find(
            (s) => s.id === group.sectionId,
          );
          if (!section) return null;

          const matchedSubsections = section.subsections.filter((sub) =>
            group.subsectionIds.has(sub.id),
          );

          return (
            <motion.div key={group.sectionId} variants={itemVariants}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-base">{group.sectionEmoji}</span>
                <h3 className="text-xs font-bold uppercase tracking-wide text-muted">
                  {group.sectionTitle}
                </h3>
              </div>
              <KTSectionContent
                subsections={matchedSubsections}
                sectionId={`search-${group.sectionId}`}
              />
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
