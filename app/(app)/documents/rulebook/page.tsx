"use client";

import { useEffect, useDeferredValue, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Briefcase,
  Trophy,
  PartyPopper,
  Swords,
} from "lucide-react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/layout/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { RULEBOOK_SECTIONS } from "@/modules/documents/rulebook-data";
import { KTSectionContent } from "../kt/kt-section-content";
import { RulebookSearchResults } from "./rulebook-search-results";
import { haptics } from "@/lib/haptics";

// Map icon names to actual components
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Briefcase,
  Trophy,
  PartyPopper,
  Swords,
};

export default function RulebookPage() {
  const searchParams = useSearchParams();
  const paramSection = searchParams.get("section");
  const paramSub = searchParams.get("sub");

  const [activeSection, setActiveSection] = useState(
    () => (paramSection && RULEBOOK_SECTIONS.find((s) => s.id === paramSection) ? paramSection : RULEBOOK_SECTIONS[0].id),
  );
  const [targetSubId, setTargetSubId] = useState<string | null>(paramSub);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const normalizedSearch = deferredSearch.trim().toLowerCase();
  const isSearching = search !== deferredSearch;
  const pillScrollRef = useRef<HTMLDivElement>(null);

  // When URL params change (navigated from search), update state
  useEffect(() => {
    if (paramSection && RULEBOOK_SECTIONS.find((s) => s.id === paramSection)) {
      setActiveSection(paramSection);
    }
    if (paramSub) {
      setTargetSubId(paramSub);
    }
  }, [paramSection, paramSub]);

  const currentSection = useMemo(
    () => RULEBOOK_SECTIONS.find((s) => s.id === activeSection) ?? RULEBOOK_SECTIONS[0],
    [activeSection],
  );

  const handleSectionChange = (sectionId: string) => {
    haptics.light();
    setActiveSection(sectionId);
    setTargetSubId(null);
  };

  const isSearchMode = normalizedSearch.length > 0;

  return (
    <>
      <PageHeader title="Section Wars Rulebook" showBack />

      <div className="space-y-3 p-4">
        {/* Search */}
        <SearchInput
          placeholder="Search the rulebook..."
          value={search}
          onChange={setSearch}
          isSearching={isSearching}
          onClear={() => setSearch("")}
        />

        {/* Section pills — hidden when searching */}
        {!isSearchMode && (
          <div
            ref={pillScrollRef}
            className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none"
          >
            {RULEBOOK_SECTIONS.map((section) => {
              const isActive = section.id === activeSection;
              const Icon = ICON_MAP[section.icon];
              return (
                <motion.button
                  key={section.id}
                  onClick={() => handleSectionChange(section.id)}
                  whileTap={{ scale: 0.95 }}
                  aria-pressed={isActive}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors min-h-[40px] ${
                    isActive
                      ? "border-primary-500 bg-primary-500 text-white"
                      : "border-border bg-white text-foreground active:bg-gray-100"
                  }`}
                >
                  {Icon && (
                    <Icon
                      className={`h-3.5 w-3.5 ${isActive ? "text-white" : "text-muted"}`}
                    />
                  )}
                  <span>{section.title}</span>
                </motion.button>
              );
            })}
          </div>
        )}

        {/* Section header — hidden when searching */}
        {!isSearchMode && (
          <div className="flex items-center gap-2 pt-1">
            <span className="text-lg">{currentSection.emoji}</span>
            <h2 className="text-sm font-bold text-foreground">
              {currentSection.title}
            </h2>
            <span className="text-xs text-muted">
              {currentSection.subsections.length} topic{currentSection.subsections.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        {/* Content */}
        {isSearchMode ? (
          <RulebookSearchResults
            query={normalizedSearch}
            onClear={() => setSearch("")}
          />
        ) : (
          <KTSectionContent
            subsections={currentSection.subsections}
            sectionId={currentSection.id}
            initialOpenId={targetSubId}
            onOpened={() => setTargetSubId(null)}
          />
        )}

        {/* Bottom padding for safe area */}
        <div className="h-4" />
      </div>
    </>
  );
}
