// ################################################################################
// # File: lib\scoreboard\types.ts                                                #
// # Check: 11/12/2025                                                            #
// ################################################################################

import type { Dispatch, SetStateAction } from "react";
import type { League, Match, PinnedLeague, EventType, Player } from "../mocks/types";

/**
 * Represents the payload needed to render the landing scoreboard.
 * Populate this struct on the server (e.g. in page.tsx) before passing the data
 * down to client components.
 */
export interface ScoreboardData {
  leagues: League[];
  matches: Match[];
  pinnedLeagues: PinnedLeague[];
}

export interface PinnedLeaguesProps {
  leagues?: PinnedLeague[];
}

export type StatusFilterOption = "All" | "Live" | "Finished";

export interface ScoreboardHeaderProps {
  leagues: League[];
  selectedFilter: StatusFilterOption;
  onFilterChange: (value: StatusFilterOption) => void;
  selectedLeague: string;
  isLeagueOpen: boolean;
  setIsLeagueOpen: Dispatch<SetStateAction<boolean>>;
  handleLeagueSelect: (league: string) => void;
  selectedDate?: Date;
  month?: Date;
  setMonth: (date: Date | undefined) => void;
  handleDateSelect: (date: Date | undefined) => void;
}

export interface ParsedFormation {
  gk: Player[];
  def: Player[];
  mid: Player[];
  fwd: Player[];
  lines: Player[][];
}