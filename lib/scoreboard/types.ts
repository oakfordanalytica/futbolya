import type { League, Match, PinnedLeague } from "../mocks/types";

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
