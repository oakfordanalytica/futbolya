"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { format, isSameDay, isToday } from "date-fns";
import { ButtonGroup } from "./button-group";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./button";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { Calendar } from "./calendar";
import { useWeekCarousel } from "@/hooks/use-week-carousel";

interface WeekStripProps {
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  month?: Date;
  onMonthChange?: (date: Date | undefined) => void;
  className?: string;
}

export function WeekStrip({
  selectedDate,
  onDateSelect,
  month,
  onMonthChange,
  className,
}: WeekStripProps) {
  const {
    weeks,
    currentWeekIndex,
    goToPreviousWeek,
    goToNextWeek,
    canGoPrevious,
    canGoNext,
  } = useWeekCarousel({
    selectedDate,
  });
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);

  const activeWeek = weeks[currentWeekIndex] ?? [];

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onDateSelect?.(date);
    }
    setIsCalendarOpen(false);
  };

  return (
    <div className={cn("relative w-full", className)}>
      <div className="flex items-center gap-2 md:pr-10">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={goToPreviousWeek}
          disabled={!canGoPrevious}
          className="shrink-0"
        >
          <ChevronLeftIcon className="size-4" />
          <span className="sr-only">Previous week</span>
        </Button>

        <ButtonGroup className="w-full">
          {activeWeek.map((day) => {
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isTodayDate = isToday(day);

            return (
              <button
                key={day.toISOString()}
                onClick={() => onDateSelect?.(day)}
                type="button"
                className={cn(
                  "flex flex-1 cursor-pointer flex-col items-center justify-center rounded-lg px-1 py-2 transition-colors",
                  isSelected
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                  isTodayDate && !isSelected && "text-foreground",
                )}
              >
                <span className="text-[11px] font-medium uppercase tracking-wide md:text-xs">
                  {format(day, "EEE")}
                </span>
                <span className="mt-0.5 text-[10px] font-semibold md:text-[11px]">
                  {format(day, "MMM d")}
                </span>
              </button>
            );
          })}
        </ButtonGroup>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={goToNextWeek}
          disabled={!canGoNext}
          className="shrink-0"
        >
          <ChevronRightIcon className="size-4" />
          <span className="sr-only">Next week</span>
        </Button>
      </div>

      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date-picker"
            variant="ghost"
            className="absolute right-0 top-1/2 hidden size-8 -translate-y-1/2 md:flex"
          >
            <CalendarIcon className="size-5" />
            <span className="sr-only">Select date</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="end">
          <Calendar
            mode="single"
            selected={selectedDate}
            captionLayout="dropdown"
            month={month}
            onMonthChange={onMonthChange}
            onSelect={handleDateSelect}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
