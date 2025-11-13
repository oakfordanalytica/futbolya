// ################################################################################
// # File: lib\scoreboard\utils.ts                                                 #
// # Check: 11/12/2025                                                            #
// ################################################################################

import type { ScoreboardData } from "./types";
import {
  leagues as mockLeagues,
  matches as mockMatches,
  pinnedLeagues as mockPinnedLeagues,
} from "../mocks/data";
import { Match } from "../mocks/types";
import type { Player } from "../mocks/types";
import type { ParsedFormation } from "./types";



/**
 * Server-side helper that provides the data required to render the landing
 * scoreboard. Replace the body with real fetching logic once the backend is
 * connected (Convex, REST, etc.).
 */
export async function getScoreboardData(): Promise<ScoreboardData> {
  // TODO: Swap mock data with Convex queries when backend integration is ready.
  return {
    leagues: mockLeagues,
    matches: mockMatches,
    pinnedLeagues: mockPinnedLeagues,
  };
}

/**
 * Server-side helper that provides the data for a single match.
 * Replace with real fetching logic.
 */
export async function getMatchById(id: string): Promise<Match | undefined> {
  // TODO: Swap mock data with Convex queries when backend integration is ready.
  const matchId = parseInt(id, 10);
  return mockMatches.find((match) => match.id === matchId);
}

/**
 * Parses a flat list of starters into formation lines *using*
 * their position property.
 *
 * @param starters - The flat array of 11 starting players.
 * @returns An object with players grouped by position.
 */
export function parseFormation(
  starters: Player[]
): ParsedFormation {
  const gk = starters.filter((p) => p.position === "GK");
  const def = starters.filter((p) => p.position === "DF");
  const mid = starters.filter((p) => p.position === "MF");
  const fwd = starters.filter((p) => p.position === "FW");
  const lines = [def, mid, fwd].filter((line) => line.length > 0);

  return { gk, def, mid, fwd, lines };
}