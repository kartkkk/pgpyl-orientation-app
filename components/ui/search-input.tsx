import { Loader2, Search, X } from "lucide-react";
import { haptics } from "@/lib/haptics";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  isSearching?: boolean;
  onClear?: () => void;
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  isSearching = false,
  onClear,
}: SearchInputProps) {
  const showClear = value.trim().length > 0;

  return (
    <div className="group relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted transition-colors group-focus-within:text-primary-500" />

      <input
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border-0 bg-surface-alt py-2.5 pl-10 pr-20 text-sm placeholder:text-muted transition-shadow focus:outline-none focus:ring-1 focus:ring-primary-500"
      />

      <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
        {isSearching && <Loader2 className="h-4 w-4 animate-spin text-muted" />}
        {showClear && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              haptics.light();
              if (onClear) {
                onClear();
                return;
              }
              onChange("");
            }}
            className="min-h-9 min-w-9 rounded-md p-1 text-muted transition-transform active:scale-90 active:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}