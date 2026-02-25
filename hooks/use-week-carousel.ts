"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { addDays, startOfWeek, differenceInWeeks } from "date-fns";

interface UseWeekCarouselProps {
  selectedDate?: Date;
}

const WEEK_WINDOW = 10;

export function useWeekCarousel({ selectedDate }: UseWeekCarouselProps = {}) {
  const initialDateRef = useRef(selectedDate || new Date());

  // Generate 21 weeks (10 before, current, 10 after) only once.
  const weeks = useMemo(() => {
    const baseWeek = startOfWeek(initialDateRef.current, {
      weekStartsOn: 0,
    });

    return Array.from({ length: 21 }, (_, weekOffset) => {
      const weekStart = addDays(baseWeek, (weekOffset - WEEK_WINDOW) * 7);
      return Array.from({ length: 7 }, (_, dayOffset) =>
        addDays(weekStart, dayOffset),
      );
    });
  }, []);

  const [currentWeekIndex, setCurrentWeekIndex] = useState(WEEK_WINDOW);

  useEffect(() => {
    if (!selectedDate) {
      return;
    }

    const baseWeek = startOfWeek(initialDateRef.current, {
      weekStartsOn: 0,
    });
    const selectedWeek = startOfWeek(selectedDate, {
      weekStartsOn: 0,
    });

    const weekDiff = differenceInWeeks(selectedWeek, baseWeek);
    const targetIndex = WEEK_WINDOW + weekDiff;

    if (targetIndex >= 0 && targetIndex < weeks.length) {
      setCurrentWeekIndex(targetIndex);
    }
  }, [selectedDate, weeks.length]);

  const goToPreviousWeek = useCallback(() => {
    setCurrentWeekIndex((current) => Math.max(0, current - 1));
  }, []);

  const goToNextWeek = useCallback(() => {
    setCurrentWeekIndex((current) => Math.min(weeks.length - 1, current + 1));
  }, [weeks.length]);

  return {
    weeks,
    currentWeekIndex,
    goToPreviousWeek,
    goToNextWeek,
    canGoPrevious: currentWeekIndex > 0,
    canGoNext: currentWeekIndex < weeks.length - 1,
  };
}
