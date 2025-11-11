"use client";

import { useState } from "react";
import { parseDate } from "chrono-node";
import { formatDate } from "@/lib/utils";

export function useScoreboardFilters() {
  // League filter
  const [selectedLeague, setSelectedLeague] = useState("");
  const [isLeagueOpen, setIsLeagueOpen] = useState(false);

  // Date filter
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(),
  );
  const [month, setMonth] = useState<Date | undefined>(new Date());

  // Text input for natural language date
  const [dateInput, setDateInput] = useState("");

  const handleLeagueSelect = (league: string) => {
    setSelectedLeague(league);
    setIsLeagueOpen(false);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setMonth(date);
    setDateInput(date ? formatDate(date) : "");
  };

  const handleDateInputChange = (input: string) => {
    setDateInput(input);
    const parsedDate = parseDate(input);
    if (parsedDate) {
      setSelectedDate(parsedDate);
      setMonth(parsedDate);
    }
  };

  return {
    // League state
    selectedLeague,
    isLeagueOpen,
    setIsLeagueOpen,
    handleLeagueSelect,

    // Date state
    selectedDate,
    month,
    setMonth,
    dateInput,
    handleDateSelect,
    handleDateInputChange,
  };
}
