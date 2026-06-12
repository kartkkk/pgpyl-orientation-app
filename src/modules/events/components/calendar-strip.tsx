"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  eachDayOfInterval,
  format,
  isSameDay,
  isToday,
} from "date-fns";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";

interface CalendarStripProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  search: string;
  onSearchChange: (value: string) => void;
}

export function CalendarStrip({
  selectedDate,
  onSelectDate,
  search,
  onSearchChange,
}: CalendarStripProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [weekStart, setWeekStart] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );

  const weekDays = useMemo(
    () =>
      eachDayOfInterval({
        start: weekStart,
        end: endOfWeek(weekStart, { weekStartsOn: 1 }),
      }),
    [weekStart],
  );

  const isCurrentWeek = useMemo(
    () => isSameDay(weekStart, startOfWeek(new Date(), { weekStartsOn: 1 })),
    [weekStart],
  );

  const goToPrevWeek = useCallback(() => {
    setWeekStart((prev) => subWeeks(prev, 1));
  }, []);

  const goToNextWeek = useCallback(() => {
    setWeekStart((prev) => addWeeks(prev, 1));
  }, []);

  const goToToday = useCallback(() => {
    const today = new Date();
    setWeekStart(startOfWeek(today, { weekStartsOn: 1 }));
    onSelectDate(today);
  }, [onSelectDate]);

  const openSearch = useCallback(() => {
    setSearchOpen(true);
  }, []);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    onSearchChange("");
  }, [onSearchChange]);

  // Auto-focus input when search opens
  useEffect(() => {
    if (searchOpen) {
      inputRef.current?.focus();
    }
  }, [searchOpen]);

  return (
    <div className="border-b border-border bg-white">
      {/* Title row / Search bar */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-2">
        {searchOpen ? (
          <div className="flex flex-1 items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5">
            <Search className="h-4 w-4 shrink-0 text-muted" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search all events..."
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
            />
            <button
              onClick={closeSearch}
              aria-label="Close search"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full active:bg-gray-200"
            >
              <X className="h-4 w-4 text-muted" />
            </button>
          </div>
        ) : (
          <>
            <h2 className="min-w-0 flex-1 text-base font-semibold text-foreground">
              {format(selectedDate, "EEEE, MMMM d")}
            </h2>
            <button
              onClick={openSearch}
              aria-label="Search events"
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted active:bg-gray-100"
            >
              <Search className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-1">
              <button
                onClick={goToPrevWeek}
                aria-label="Previous week"
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted active:bg-gray-100"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              {!isCurrentWeek && (
                <button
                  onClick={goToToday}
                  className="rounded-full bg-primary-50 px-2.5 py-1 text-[11px] font-medium text-primary-500 active:bg-primary-100"
                >
                  Today
                </button>
              )}
              <button
                onClick={goToNextWeek}
                aria-label="Next week"
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted active:bg-gray-100"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Day strip — hidden when searching */}
      {!searchOpen && (
        <div className="flex justify-between px-3 pb-3">
          {weekDays.map((day) => {
            const selected = isSameDay(day, selectedDate);
            const today = isToday(day);

            return (
              <button
                key={day.toISOString()}
                onClick={() => onSelectDate(day)}
                className={`flex w-11 flex-col items-center gap-0.5 rounded-xl py-1.5 transition-colors ${
                  selected
                    ? "bg-primary-500 text-white"
                    : today
                      ? "text-primary-500"
                      : "text-muted"
                }`}
              >
                <span className="text-[10px] font-medium uppercase leading-none">
                  {format(day, "EEE")}
                </span>
                <span className="text-sm font-semibold leading-none">
                  {format(day, "d")}
                </span>
                {today && !selected && (
                  <span className="mt-0.5 h-1 w-1 rounded-full bg-primary-500" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
