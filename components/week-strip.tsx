"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { addDays, startOfWeek, format, isSameDay, isToday } from "date-fns";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselApi,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";

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
  const [api, setApi] = React.useState<CarouselApi>();
  const [currentWeekIndex, setCurrentWeekIndex] = React.useState(10);

  // Generate 21 weeks (10 before, current, 10 after) for smooth navigation
  const weeks = React.useMemo(() => {
    const baseWeek = startOfWeek(selectedDate || new Date(), {
      weekStartsOn: 0,
    });
    return Array.from({ length: 21 }, (_, i) => {
      const weekStart = addDays(baseWeek, (i - 10) * 7);
      return Array.from({ length: 7 }, (_, j) => addDays(weekStart, j));
    });
  }, [selectedDate]);

  const handleDateClick = (date: Date) => {
    onDateSelect?.(date);
  };

  const handlePrevious = React.useCallback(() => {
    api?.scrollPrev();
  }, [api]);

  const handleNext = React.useCallback(() => {
    api?.scrollNext();
  }, [api]);

  React.useEffect(() => {
    if (!api) return;

    api.on("select", () => {
      setCurrentWeekIndex(api.selectedScrollSnap());
    });

    // Initialize to middle week
    api.scrollTo(10, true);
  }, [api]);

  return (
    <div className={cn("flex items-center gap-2 w-full", className)}>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={handlePrevious}
        className="shrink-0"
        aria-label="Previous week"
      >
        <ChevronLeft className="size-4" />
      </Button>

      <div className="flex-1 min-w-0">
        <Carousel
          setApi={setApi}
          className="w-full"
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
                    const isSelected =
                      selectedDate && isSameDay(day, selectedDate);
                    const isTodayDate = isToday(day);

                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => handleDateClick(day)}
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
        </Carousel>
      </div>

      <Button
        variant="ghost"
        size="icon-sm"
        onClick={handleNext}
        className="shrink-0"
        aria-label="Next week"
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
