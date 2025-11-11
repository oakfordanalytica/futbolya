"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { addDays, startOfWeek, differenceInWeeks } from "date-fns";
import type { CarouselApi } from "@/components/ui/carousel";

interface UseWeekCarouselProps {
  selectedDate?: Date;
}

export function useWeekCarousel({ selectedDate }: UseWeekCarouselProps = {}) {
  const [api, setApi] = useState<CarouselApi>();

  // Use ref to store initial date and prevent regeneration
  const initialDateRef = useRef(selectedDate || new Date());

  // Generate 21 weeks (10 before, current, 10 after) - only once
  const weeks = useMemo(() => {
    const baseWeek = startOfWeek(initialDateRef.current, {
      weekStartsOn: 0,
    });
    return Array.from({ length: 21 }, (_, i) => {
      const weekStart = addDays(baseWeek, (i - 10) * 7);
      return Array.from({ length: 7 }, (_, j) => addDays(weekStart, j));
    });
  }, []); // Empty dependency array - only calculate once

  // Initialize carousel to middle week
  useEffect(() => {
    if (!api) return;
    api.scrollTo(10, true);
  }, [api]);

  // Scroll to week containing selected date
  useEffect(() => {
    if (!api || !selectedDate) return;

    const baseWeek = startOfWeek(initialDateRef.current, {
      weekStartsOn: 0,
    });
    const selectedWeek = startOfWeek(selectedDate, {
      weekStartsOn: 0,
    });

    // Calculate week difference
    const weekDiff = differenceInWeeks(selectedWeek, baseWeek);

    // Middle week is at index 10, so target index is 10 + weekDiff
    const targetIndex = 10 + weekDiff;

    // Only scroll if target is within bounds (0-20)
    if (targetIndex >= 0 && targetIndex < weeks.length) {
      api.scrollTo(targetIndex);
    }
  }, [selectedDate, api, weeks.length]);

  return {
    weeks,
    setApi,
  };
}
