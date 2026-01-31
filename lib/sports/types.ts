export type SportType = "soccer" | "basketball";

export interface SportTerminology {
  team: string;
  teams: string;
  match: string;
  matches: string;
  score: string;
  division: string;
  divisions: string;
  club: string;
  clubs: string;
  tournament: string;
  tournaments: string;
  player: string;
  players: string;
  group: string;
  groups: string;
}

export interface SportConfig {
  id: SportType;
  positions: readonly string[];
  playerStatFields: readonly string[];
  standingsStatFields: readonly string[];
  defaultMatchDuration: number;
  pointsForWin: number;
  pointsForDraw: number | null;
  features: {
    hasCategories: boolean;
    hasConferences: boolean;
    hasPromotionRelegation: boolean;
  };
  terminologyKey: string;
}
