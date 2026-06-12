import { Loader2 } from "lucide-react";

interface SearchStatusHintProps {
  isActive: boolean;
  label: string;
}

export function SearchStatusHint({ isActive, label }: SearchStatusHintProps) {
  if (!isActive) return null;

  return (
    <p className="flex items-center gap-1.5 text-[11px] text-muted">
      <Loader2 className="h-3.5 w-3.5 animate-spin" />
      {label}
    </p>
  );
}