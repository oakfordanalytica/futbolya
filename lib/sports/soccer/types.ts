export type SoccerPosition =
  | "goalkeeper"
  | "defender"
  | "midfielder"
  | "forward";

export type PreferredFoot = "left" | "right" | "both";

export interface SoccerPlayerStats {
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  matchesPlayed: number;
}

export interface SoccerStandingsStats {
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  draws: number;
}
