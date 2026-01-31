import type { SportConfig } from "../types";
import type { SoccerPosition } from "./types";

export const soccerConfig: SportConfig = {
  id: "soccer",
  positions: ["goalkeeper", "defender", "midfielder", "forward"] as const,
  playerStatFields: [
    "goals",
    "assists",
    "yellowCards",
    "redCards",
    "matchesPlayed",
  ] as const,
  standingsStatFields: [
    "goalsFor",
    "goalsAgainst",
    "goalDifference",
    "draws",
  ] as const,
  defaultMatchDuration: 90,
  pointsForWin: 3,
  pointsForDraw: 1,
  features: {
    hasCategories: true,
    hasConferences: false,
    hasPromotionRelegation: true,
  },
  terminologyKey: "soccer",
};

export const SOCCER_POSITIONS: readonly SoccerPosition[] = [
  "goalkeeper",
  "defender",
  "midfielder",
  "forward",
] as const;
