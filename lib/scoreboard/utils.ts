import type { ScoreboardData } from "./types";
import {
  leagues as mockLeagues,
  matches as mockMatches,
  pinnedLeagues as mockPinnedLeagues,
} from "../mocks/data";

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
