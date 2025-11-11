"use client";

import { useMemo, useState } from "react";

import { ScoreboardBody } from "@/components/sections/landing/scoreboard-body";
import { ScoreboardHeader } from "@/components/sections/landing/scoreboard-header";
import { useScoreboardFilters } from "@/hooks/use-scoreboard-filters";
import type { League, Match } from "@/lib/mocks/types";
import type { StatusFilterOption } from "@/lib/scoreboard/types";

const FINISHED_STATUSES = new Set(["ft", "final", "finished"]);

interface ScoreboardProps {
  leagues: League[];
  matches: Match[];
}

export function Scoreboard({ leagues, matches }: ScoreboardProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>("All");

  const {
    selectedLeague,
    isLeagueOpen,
    setIsLeagueOpen,
    handleLeagueSelect,
    selectedDate,
    month,
    setMonth,
    handleDateSelect,
  } = useScoreboardFilters();

  const filteredMatches = useMemo(() => {
    return matches.filter((match) => {
      const matchesLeague = selectedLeague
        ? match.league === selectedLeague
        : true;

      const normalizedStatus = match.status.toLowerCase();
      const matchesStatus =
        statusFilter === "All"
          ? true
          : statusFilter === "Live"
            ? normalizedStatus === "live"
            : FINISHED_STATUSES.has(normalizedStatus);

      return matchesLeague && matchesStatus;
    });
  }, [matches, selectedLeague, statusFilter]);

  return (
    <section className="flex flex-col gap-4">
      <ScoreboardHeader
        leagues={leagues}
        selectedFilter={statusFilter}
        onFilterChange={setStatusFilter}
        selectedLeague={selectedLeague}
        isLeagueOpen={isLeagueOpen}
        setIsLeagueOpen={setIsLeagueOpen}
        handleLeagueSelect={handleLeagueSelect}
        selectedDate={selectedDate}
        month={month}
        setMonth={setMonth}
        handleDateSelect={handleDateSelect}
      />
      <ScoreboardBody matches={filteredMatches} />
    </section>
  );
}
