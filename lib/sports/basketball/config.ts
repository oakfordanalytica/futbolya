import type { SportConfig } from "../types";

export const basketballConfig: SportConfig = {
  id: "basketball",
  positions: [
    "point_guard",
    "shooting_guard",
    "small_forward",
    "power_forward",
    "center",
  ] as const,
  playerStatFields: [
    "points",
    "rebounds",
    "assists",
    "steals",
    "blocks",
    "gamesPlayed",
  ] as const,
  standingsStatFields: [
    "pointsFor",
    "pointsAgainst",
    "pointsDifference",
  ] as const,
  defaultMatchDuration: 48,
  pointsForWin: 2,
  pointsForDraw: null,
  features: {
    hasCategories: false,
    hasConferences: true,
    hasPromotionRelegation: false,
  },
  terminologyKey: "basketball",
};
