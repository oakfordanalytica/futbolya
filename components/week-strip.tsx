"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { format, isSameDay, isToday } from "date-fns";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { useWeekCarousel } from "@/hooks/use-week-carousel";

interface WeekStripProps {
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  className?: string;
}

export function WeekStrip({
  selectedDate,
  onDateSelect,
  className,
}: WeekStripProps) {
  const { weeks, setApi } = useWeekCarousel({
    selectedDate,
  });

  return (
    <Carousel
      setApi={setApi}
      className={cn("w-full", className)}
      opts={{
        align: "start",
        loop: false,
        containScroll: "trimSnaps",
      }}
    >
      <CarouselContent className="-ml-2">
        {weeks.map((week, weekIndex) => (
          <CarouselItem key={weekIndex} className="pl-2">
            <div className="flex gap-1 w-full">
              {week.map((day) => {
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isTodayDate = isToday(day);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => onDateSelect?.(day)}
                    type="button"
                    className={cn(
                      "flex flex-1 min-w-[60px] flex-col items-center justify-center rounded-lg py-2 px-2 transition-all",
                      "hover:bg-accent/70 active:scale-95",
                      isSelected &&
                        "bg-primary text-primary-foreground hover:bg-primary/90",
                      !isSelected && isTodayDate && "bg-accent",
                    )}
                  >
                    <span
                      className={cn(
                        "text-xs font-medium uppercase tracking-wide",
                        isSelected
                          ? "text-primary-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {format(day, "EEE")}
                    </span>
                    <span
                      className={cn(
                        "text-sm font-semibold mt-0.5",
                        isSelected && "text-primary-foreground",
                      )}
                    >
                      {format(day, "MMM d")}
                    </span>
                  </button>
                );
              })}
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}
