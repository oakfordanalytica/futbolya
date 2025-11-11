"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { addDays, startOfWeek } from "date-fns";
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

  return {
    weeks,
    setApi,
  };
}
