import { Loader2 } from "lucide-react";

interface ListSkeletonProps {
  rows?: number;
  rowHeightClassName?: string;
  searching?: boolean;
  searchingLabel?: string;
}

export function ListSkeleton({
  rows = 4,
  rowHeightClassName = "h-24",
  searching = false,
  searchingLabel = "Loading...",
}: ListSkeletonProps) {
  return (
    <div className="space-y-3">
      {searching && (
        <div className="flex items-center gap-2 text-xs text-muted">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {searchingLabel}
        </div>
      )}

      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={`${rowHeightClassName} animate-pulse rounded-2xl bg-gray-100`} />
      ))}
    </div>
  );
}