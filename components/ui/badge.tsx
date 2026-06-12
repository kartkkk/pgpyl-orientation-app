import type { SectionCode } from "@/types";
import { SECTIONS } from "@/lib/constants";

interface BadgeProps {
  sectionCode: SectionCode;
  size?: "sm" | "md";
}

export function SectionBadge({ sectionCode, size = "sm" }: BadgeProps) {
  const section = SECTIONS[sectionCode];
  if (!section) return null;

  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium text-white ${sizeClasses}`}
      style={{ backgroundColor: section.color }}
    >
      <span>{section.emoji}</span>
      <span>{section.name}</span>
    </span>
  );
}

interface StatusBadgeProps {
  status: string;
  variant?: "success" | "warning" | "error" | "muted";
}

export function StatusBadge({ status, variant = "muted" }: StatusBadgeProps) {
  const variants = {
    success: "bg-emerald-500 text-white",
    warning: "bg-amber-400 text-amber-950",
    error: "bg-red-500 text-white",
    muted: "bg-gray-200 text-gray-700",
  };

  return (
    <span
      className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${variants[variant]}`}
    >
      {status}
    </span>
  );
}
