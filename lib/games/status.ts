export const GAME_STATUSES = [
  "scheduled",
  "in_progress",
  "halftime",
  "completed",
  "cancelled",
] as const;

export const LEGACY_GAME_STATUSES = [
  "awaiting_stats",
  "pending_review",
] as const;

export type GameStatus = (typeof GAME_STATUSES)[number];
export type LegacyGameStatus = (typeof LEGACY_GAME_STATUSES)[number];
export type StoredGameStatus = GameStatus | LegacyGameStatus;

export function normalizeGameStatus(status: StoredGameStatus): GameStatus {
  if (status === "awaiting_stats" || status === "pending_review") {
    return "completed";
  }

  return status;
}
