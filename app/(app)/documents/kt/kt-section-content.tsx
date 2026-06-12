"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, Phone, Mail, AlertTriangle, Info, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { haptics } from "@/lib/haptics";
import type { KTContentBlock, KTSubsection } from "@/modules/documents/kt-data";

// ─── Content Block Renderers ───

function ParagraphBlock({ text }: { text: string }) {
  return <p className="text-sm leading-relaxed text-foreground">{text}</p>;
}

function HeadingBlock({ text }: { text: string }) {
  return (
    <h4 className="text-xs font-bold uppercase tracking-wide text-primary-500 mt-2">
      {text}
    </h4>
  );
}

function ListBlock({ items, ordered }: { items: string[]; ordered?: boolean }) {
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag
      className={`space-y-1.5 pl-5 ${ordered ? "list-decimal" : "list-disc"}`}
    >
      {items.map((item, i) => (
        <li key={i} className="text-sm leading-relaxed text-foreground">
          {item}
        </li>
      ))}
    </Tag>
  );
}

function TableBlock({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto -mx-1 rounded-lg border border-border">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="bg-primary-50">
            {headers.map((h, i) => (
              <th
                key={i}
                className="whitespace-nowrap px-3 py-2 text-xs font-semibold text-primary-700"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={ri}
              className={ri % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
            >
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className="px-3 py-2 text-xs leading-relaxed text-foreground"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const CALLOUT_STYLES = {
  tip: {
    bg: "bg-emerald-50 border-emerald-200",
    icon: <Lightbulb className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />,
    text: "text-emerald-800",
  },
  warning: {
    bg: "bg-amber-50 border-amber-200",
    icon: <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />,
    text: "text-amber-800",
  },
  info: {
    bg: "bg-blue-50 border-blue-200",
    icon: <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />,
    text: "text-blue-800",
  },
};

function CalloutBlock({
  text,
  variant,
}: {
  text: string;
  variant: "tip" | "warning" | "info";
}) {
  const style = CALLOUT_STYLES[variant];
  return (
    <div
      className={`flex gap-2.5 rounded-lg border px-3 py-2.5 ${style.bg}`}
    >
      {style.icon}
      <p className={`text-xs leading-relaxed ${style.text}`}>{text}</p>
    </div>
  );
}

function ContactBlock({
  label,
  value,
  action,
}: {
  label: string;
  value: string;
  action?: "call" | "email";
}) {
  const href =
    action === "call"
      ? `tel:${value}`
      : action === "email"
        ? `mailto:${value}`
        : undefined;
  const Icon = action === "call" ? Phone : Mail;

  return (
    <a
      href={href}
      className="flex items-center gap-3 rounded-lg border border-border bg-white px-3 py-2.5 active:bg-gray-50 min-h-[44px]"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-50">
        <Icon className="h-4 w-4 text-primary-500" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted">{label}</p>
        <p className="text-sm font-medium text-primary-500 break-all">
          {value}
        </p>
      </div>
    </a>
  );
}

// ─── Block Renderer ───

function ContentBlock({ block }: { block: KTContentBlock }) {
  switch (block.type) {
    case "paragraph":
      return <ParagraphBlock text={block.text} />;
    case "heading":
      return <HeadingBlock text={block.text} />;
    case "list":
      return <ListBlock items={block.items} ordered={block.ordered} />;
    case "table":
      return <TableBlock headers={block.headers} rows={block.rows} />;
    case "callout":
      return <CalloutBlock text={block.text} variant={block.variant} />;
    case "contact":
      return (
        <ContactBlock
          label={block.label}
          value={block.value}
          action={block.action}
        />
      );
  }
}

// ─── Accordion Subsection ───

function SubsectionAccordion({
  subsection,
  isOpen,
  onToggle,
  highlighted,
}: {
  subsection: KTSubsection;
  isOpen: boolean;
  onToggle: () => void;
  highlighted?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Auto-scroll into view when highlighted (deep-linked from search)
  useEffect(() => {
    if (highlighted && ref.current) {
      // Small delay so the accordion has time to render
      const timer = setTimeout(() => {
        ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [highlighted]);

  return (
    <div ref={ref}>
      <Card
        className={`overflow-hidden p-0 transition-shadow duration-300 ${
          highlighted ? "ring-2 ring-primary-400 shadow-md" : ""
        }`}
      >
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={`${subsection.id}-content`}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left min-h-[48px] active:bg-gray-50"
        >
          <h3 className="text-sm font-semibold text-foreground leading-snug break-words">
            {subsection.title}
          </h3>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-muted transition-transform duration-250 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        <div
          id={`${subsection.id}-content`}
          aria-hidden={!isOpen}
          className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
            isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <div className="space-y-3 border-t border-border px-4 pb-4 pt-3">
              {subsection.content.map((block, i) => (
                <ContentBlock key={i} block={block} />
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── Section Content ───

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

export function KTSectionContent({
  subsections,
  sectionId,
  initialOpenId,
  onOpened,
}: {
  subsections: KTSubsection[];
  sectionId: string;
  initialOpenId?: string | null;
  onOpened?: () => void;
}) {
  const [openId, setOpenId] = useState<string | null>(initialOpenId ?? null);
  const [highlightId, setHighlightId] = useState<string | null>(initialOpenId ?? null);

  // When initialOpenId changes (deep-link navigation), open & highlight it
  useEffect(() => {
    if (initialOpenId) {
      setOpenId(initialOpenId);
      setHighlightId(initialOpenId);
      onOpened?.();
      // Clear highlight ring after a few seconds
      const timer = setTimeout(() => setHighlightId(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [initialOpenId, onOpened]);

  const toggleSubsection = useCallback(
    (id: string) => {
      haptics.light();
      setOpenId((prev) => (prev === id ? null : id));
      setHighlightId(null);
    },
    [],
  );

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={sectionId}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className="space-y-2"
      >
        {subsections.map((sub) => (
          <motion.div key={sub.id} variants={itemVariants}>
            <SubsectionAccordion
              subsection={sub}
              isOpen={openId === sub.id}
              onToggle={() => toggleSubsection(sub.id)}
              highlighted={highlightId === sub.id}
            />
          </motion.div>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}
