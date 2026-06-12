"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const DOT_COLOR = {
  ongoing: "bg-success",
  upcoming: "bg-primary-500",
  completed: "bg-gray-300",
} as const;

interface EventAccordionProps {
  title: string;
  count: number;
  variant: "ongoing" | "upcoming" | "completed";
  defaultExpanded?: boolean;
  children: React.ReactNode;
}

export function EventAccordion({
  title,
  count,
  variant,
  defaultExpanded = true,
  children,
}: EventAccordionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between py-2.5"
      >
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${DOT_COLOR[variant]}`} />
          <span className="text-sm font-semibold text-foreground">{title}</span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-muted">
            {count}
          </span>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-200 ${
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="space-y-3 pb-2">{children}</div>
        </div>
      </div>
    </div>
  );
}
