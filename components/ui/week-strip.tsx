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
import { ButtonGroup } from "./button-group";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./button";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "./calendar";

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
  const { weeks, setApi } = useWeekCarousel({
    selectedDate,
  });
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onDateSelect?.(date);
    }
    setIsCalendarOpen(false);
  };

  return (
    <div className="relative w-full">
      <Carousel
        setApi={setApi}
        className={cn("w-full md:pr-10", className)}
        opts={{
          align: "start",
          loop: false,
          containScroll: "trimSnaps",
        }}
      >
        <CarouselContent className="">
          {weeks.map((week, weekIndex) => (
            <CarouselItem key={weekIndex} className="">
              <ButtonGroup className="w-full md:px-5">
                {week.map((day) => {
                  const isSelected =
                    selectedDate && isSameDay(day, selectedDate);
                  const isTodayDate = isToday(day);

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => onDateSelect?.(day)}
                      type="button"
                      className={cn(
                        "flex flex-1 flex-col items-center cursor-pointer justify-center rounded-lg transition-colors",
                        isSelected
                          ? "text-foreground"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <span className="text-[12px] md:text-sm font-medium uppercase tracking-wide">
                        {format(day, "EEE")}
                      </span>
                      <span className="text-[10px] md:text-xs font-semibold mt-0.5">
                        {format(day, "MMM d")}
                      </span>
                    </button>
                  );
                })}
              </ButtonGroup>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-0 shadow-none border-none hidden md:flex" />
        <CarouselNext className="right-10 shadow-none border-none hidden md:flex" />
      </Carousel>

      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date-picker"
            variant="ghost"
            className="absolute hidden md:flex top-1/2 right-0 size-8 -translate-y-1/2"
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
