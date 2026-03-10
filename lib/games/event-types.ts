export const GAME_EVENT_TYPES = [
  "goal",
  "yellow_card",
  "red_card",
  "substitution",
  "penalty_scored",
  "penalty_missed",
] as const;

export type GameEventType = (typeof GAME_EVENT_TYPES)[number];

export const GAME_EVENT_TYPE_ICONS: Record<GameEventType, string> = {
  goal: "⚽",
  yellow_card: "🟨",
  red_card: "🟥",
  substitution: "🔁",
  penalty_scored: "🎯",
  penalty_missed: "❌",
};
