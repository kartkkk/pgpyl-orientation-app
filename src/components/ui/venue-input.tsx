"use client";

import { useState, useMemo, useRef } from "react";
import { PRESET_VENUES } from "@/modules/events/venue-metadata";

interface VenueInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
}

export function VenueInput({
  value,
  onChange,
  label = "Venue",
  placeholder = "Enter a venue...",
}: VenueInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const blurTimeout = useRef<ReturnType<typeof setTimeout>>(null);

  const suggestions = useMemo(() => {
    if (!isFocused) return [];
    if (!value.trim()) return [...PRESET_VENUES];
    const lower = value.toLowerCase();
    return PRESET_VENUES.filter((v) => v.toLowerCase().includes(lower));
  }, [value, isFocused]);

  const showDropdown = isFocused && suggestions.length > 0;

  const handleFocus = () => {
    if (blurTimeout.current) clearTimeout(blurTimeout.current);
    setIsFocused(true);
  };

  const handleBlur = () => {
    // Delay so click/tap on a suggestion registers before the dropdown hides
    blurTimeout.current = setTimeout(() => setIsFocused(false), 150);
  };

  const selectVenue = (venue: string) => {
    onChange(venue);
    setIsFocused(false);
  };

  return (
    <div className="relative z-10">
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="w-full rounded-xl border border-border px-3.5 py-3.5 text-sm transition-colors placeholder:text-muted focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-0 mt-1 overflow-hidden rounded-xl border border-border bg-white shadow-sm">
          {suggestions.map((venue) => {
            const isSelected = venue === value;
            return (
              <button
                key={venue}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectVenue(venue)}
                className={`w-full px-3.5 py-3 text-left text-sm border-b border-gray-50 last:border-b-0 ${
                  isSelected
                    ? "bg-primary-50 font-medium text-primary-600"
                    : "text-foreground hover:bg-gray-50"
                }`}
              >
                {venue}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
