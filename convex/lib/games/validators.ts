import { v } from "convex/values";
import type { Id } from "../../_generated/dataModel";
import type { StoredGameStatus } from "@/lib/games/status";

export const gender = v.union(
  v.literal("male"),
  v.literal("female"),
  v.literal("mixed"),
);

export const gameStatus = v.union(
  v.literal("scheduled"),
  v.literal("in_progress"),
  v.literal("halftime"),
  v.literal("completed"),
  v.literal("cancelled"),
);

export const storedGameStatus = v.union(
  v.literal("scheduled"),
  v.literal("in_progress"),
  v.literal("halftime"),
  v.literal("awaiting_stats"),
  v.literal("pending_review"),
  v.literal("completed"),
  v.literal("cancelled"),
);

export const gameType = v.union(v.literal("quick"), v.literal("season"));

export const gameMatchPhase = v.union(
  v.literal("first_half"),
  v.literal("halftime"),
  v.literal("second_half"),
  v.literal("finished"),
);

export const gameValidator = v.object({
  _id: v.id("games"),
  _creationTime: v.number(),
  organizationId: v.id("organizations"),
  seasonId: v.optional(v.string()),
  homeClubId: v.id("clubs"),
  awayClubId: v.id("clubs"),
  homeClubSlug: v.string(),
  awayClubSlug: v.string(),
  homeTeamName: v.string(),
  awayTeamName: v.string(),
  homeTeamLogo: v.optional(v.string()),
  awayTeamLogo: v.optional(v.string()),
  homeTeamColor: v.optional(v.string()),
  awayTeamColor: v.optional(v.string()),
  date: v.string(),
  startTime: v.string(),
  category: v.string(),
  gender,
  locationName: v.optional(v.string()),
  locationCoordinates: v.optional(v.array(v.number())),
  status: gameStatus,
  homeScore: v.optional(v.number()),
  awayScore: v.optional(v.number()),
  matchStartedAt: v.optional(v.number()),
  matchEndedAt: v.optional(v.number()),
  matchPhase: v.optional(gameMatchPhase),
  firstHalfStartedAt: v.optional(v.number()),
  firstHalfEndedAt: v.optional(v.number()),
  secondHalfStartedAt: v.optional(v.number()),
  secondHalfEndedAt: v.optional(v.number()),
  firstHalfAddedMinutes: v.optional(v.number()),
  secondHalfAddedMinutes: v.optional(v.number()),
});

export const gameListItemValidator = v.object({
  _id: v.id("games"),
  _creationTime: v.number(),
  seasonId: v.optional(v.string()),
  gameType,
  homeTeamId: v.string(),
  homeTeamName: v.string(),
  homeTeamLogo: v.optional(v.string()),
  awayTeamId: v.string(),
  awayTeamName: v.string(),
  awayTeamLogo: v.optional(v.string()),
  date: v.string(),
  startTime: v.string(),
  category: v.string(),
  gender,
  locationName: v.optional(v.string()),
  locationCoordinates: v.optional(v.array(v.number())),
  status: gameStatus,
  homeScore: v.optional(v.number()),
  awayScore: v.optional(v.number()),
  matchStartedAt: v.optional(v.number()),
  matchEndedAt: v.optional(v.number()),
  matchPhase: v.optional(gameMatchPhase),
  firstHalfStartedAt: v.optional(v.number()),
  firstHalfEndedAt: v.optional(v.number()),
  secondHalfStartedAt: v.optional(v.number()),
  secondHalfEndedAt: v.optional(v.number()),
  firstHalfAddedMinutes: v.optional(v.number()),
  secondHalfAddedMinutes: v.optional(v.number()),
});

export const seasonValidator = v.object({
  id: v.string(),
  name: v.string(),
  startDate: v.string(),
  endDate: v.string(),
});

export const playerStatsValidator = v.object({
  _id: v.id("gamePlayerStats"),
  playerId: v.id("players"),
  playerName: v.string(),
  jerseyNumber: v.optional(v.number()),
  cometNumber: v.optional(v.string()),
  photoUrl: v.optional(v.string()),
  clubId: v.id("clubs"),
  isStarter: v.boolean(),
  goals: v.optional(v.number()),
  yellowCards: v.optional(v.number()),
  redCards: v.optional(v.number()),
  penaltiesAttempted: v.optional(v.number()),
  penaltiesScored: v.optional(v.number()),
  substitutionsIn: v.optional(v.number()),
  substitutionsOut: v.optional(v.number()),
});

export const teamStatsValidator = v.object({
  clubId: v.id("clubs"),
  goals: v.number(),
  corners: v.number(),
  freeKicks: v.number(),
  yellowCards: v.number(),
  redCards: v.number(),
  penaltiesAttempted: v.number(),
  penaltiesScored: v.number(),
  substitutions: v.number(),
});

export const seasonPlayerLeaderValidator = v.object({
  playerId: v.id("players"),
  playerName: v.string(),
  photoUrl: v.optional(v.string()),
  clubId: v.id("clubs"),
  clubName: v.string(),
  gamesPlayed: v.number(),
  goals: v.number(),
  goalsPerGame: v.number(),
  yellowCards: v.number(),
  redCards: v.number(),
  penaltiesScored: v.number(),
});

export const seasonTeamLeaderValidator = v.object({
  clubId: v.id("clubs"),
  clubName: v.string(),
  gamesPlayed: v.number(),
  wins: v.number(),
  draws: v.number(),
  losses: v.number(),
  points: v.number(),
  goalsFor: v.number(),
  goalsAgainst: v.number(),
  goalDifference: v.number(),
  cleanSheets: v.number(),
});

export const seasonPlayerStatsRowValidator = v.object({
  playerId: v.id("players"),
  playerName: v.string(),
  photoUrl: v.optional(v.string()),
  clubId: v.id("clubs"),
  clubName: v.string(),
  clubNickname: v.optional(v.string()),
  gamesPlayed: v.number(),
  starts: v.number(),
  goals: v.number(),
  goalsPerGame: v.number(),
  yellowCards: v.number(),
  yellowCardsPerGame: v.number(),
  redCards: v.number(),
  redCardsPerGame: v.number(),
  penaltiesAttempted: v.number(),
  penaltiesScored: v.number(),
  penaltyConversionPct: v.number(),
  substitutionsIn: v.number(),
  substitutionsOut: v.number(),
});

export const seasonTeamStatsRowValidator = v.object({
  clubId: v.id("clubs"),
  clubName: v.string(),
  clubNickname: v.optional(v.string()),
  clubLogoUrl: v.optional(v.string()),
  gamesPlayed: v.number(),
  wins: v.number(),
  draws: v.number(),
  losses: v.number(),
  points: v.number(),
  goalsFor: v.number(),
  goalsAgainst: v.number(),
  goalDifference: v.number(),
  cleanSheets: v.number(),
  corners: v.number(),
  cornersPerGame: v.number(),
  freeKicks: v.number(),
  freeKicksPerGame: v.number(),
  yellowCards: v.number(),
  yellowCardsPerGame: v.number(),
  redCards: v.number(),
  redCardsPerGame: v.number(),
  penaltiesAttempted: v.number(),
  penaltiesScored: v.number(),
  penaltyConversionPct: v.number(),
  substitutions: v.number(),
  substitutionsPerGame: v.number(),
});

export type SeasonPlayerLeader = {
  playerId: Id<"players">;
  playerName: string;
  photoUrl?: string;
  clubId: Id<"clubs">;
  clubName: string;
  gamesPlayed: number;
  goals: number;
  goalsPerGame: number;
  yellowCards: number;
  redCards: number;
  penaltiesScored: number;
};

export type SeasonTeamLeader = {
  clubId: Id<"clubs">;
  clubName: string;
  gamesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  cleanSheets: number;
};

export type SeasonPlayerStatsRow = {
  playerId: Id<"players">;
  playerName: string;
  photoUrl?: string;
  clubId: Id<"clubs">;
  clubName: string;
  clubNickname?: string;
  gamesPlayed: number;
  starts: number;
  goals: number;
  goalsPerGame: number;
  yellowCards: number;
  yellowCardsPerGame: number;
  redCards: number;
  redCardsPerGame: number;
  penaltiesAttempted: number;
  penaltiesScored: number;
  penaltyConversionPct: number;
  substitutionsIn: number;
  substitutionsOut: number;
};

export type SeasonTeamStatsRow = {
  clubId: Id<"clubs">;
  clubName: string;
  clubNickname?: string;
  clubLogoUrl?: string;
  gamesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  cleanSheets: number;
  corners: number;
  cornersPerGame: number;
  freeKicks: number;
  freeKicksPerGame: number;
  yellowCards: number;
  yellowCardsPerGame: number;
  redCards: number;
  redCardsPerGame: number;
  penaltiesAttempted: number;
  penaltiesScored: number;
  penaltyConversionPct: number;
  substitutions: number;
  substitutionsPerGame: number;
};

export type SeasonPlayerLeaders = {
  goals: Array<SeasonPlayerLeader>;
  goalsPerGame: Array<SeasonPlayerLeader>;
  yellowCards: Array<SeasonPlayerLeader>;
  redCards: Array<SeasonPlayerLeader>;
  penaltiesScored: Array<SeasonPlayerLeader>;
};

export type SeasonTeamLeaders = {
  points: Array<SeasonTeamLeader>;
  goalsFor: Array<SeasonTeamLeader>;
  goalsAgainst: Array<SeasonTeamLeader>;
  goalDifference: Array<SeasonTeamLeader>;
  cleanSheets: Array<SeasonTeamLeader>;
};

export type SeasonStatsAggregate = {
  season: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
  };
  gamesCount: number;
  playerRows: Array<SeasonPlayerStatsRow>;
  teamRows: Array<SeasonTeamStatsRow>;
};

export type TeamStatsDoc = {
  _id: Id<"gameTeamStats">;
  gameId: Id<"games">;
  clubId: Id<"clubs">;
  corners?: number;
  freeKicks?: number;
  substitutions?: number;
};

export type GameDoc = {
  _id: Id<"games">;
  organizationId: Id<"organizations">;
  homeClubId: Id<"clubs">;
  awayClubId: Id<"clubs">;
  homeScore?: number;
  awayScore?: number;
  matchStartedAt?: number;
  matchEndedAt?: number;
  status: StoredGameStatus;
};
