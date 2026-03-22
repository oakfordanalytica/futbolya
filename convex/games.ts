import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  gameListItemValidator,
  gameStatus,
  gameValidator,
  gender,
  playerStatsValidator,
  seasonPlayerLeaderValidator,
  seasonPlayerStatsRowValidator,
  seasonTeamLeaderValidator,
  seasonTeamStatsRowValidator,
  seasonValidator,
  teamStatsValidator,
} from "./lib/games/validators";
import {
  getByIdHandler,
  getGamePlayerStatsHandler,
  getSeasonLeadersHandler,
  getSeasonStatsTableHandler,
  listByClubSlugHandler,
  listByLeagueSlugHandler,
} from "./lib/games/queries";
import {
  createGameHandler,
  removeGameHandler,
  updateGameHandler,
} from "./lib/games/mutations";

export const listByLeagueSlug = query({
  args: { orgSlug: v.string() },
  returns: v.array(gameListItemValidator),
  handler: listByLeagueSlugHandler,
});

export const listByClubSlug = query({
  args: { clubSlug: v.string() },
  returns: v.array(gameListItemValidator),
  handler: listByClubSlugHandler,
});

export const getGamePlayerStats = query({
  args: { gameId: v.id("games") },
  returns: v.object({
    homeStats: v.array(playerStatsValidator),
    awayStats: v.array(playerStatsValidator),
    homeTeamStats: teamStatsValidator,
    awayTeamStats: teamStatsValidator,
  }),
  handler: getGamePlayerStatsHandler,
});

export const getSeasonLeaders = query({
  args: {
    orgSlug: v.string(),
    seasonId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.object({
    season: seasonValidator,
    gamesCount: v.number(),
    leaderLimit: v.number(),
    playerLeaders: v.object({
      goals: v.array(seasonPlayerLeaderValidator),
      goalsPerGame: v.array(seasonPlayerLeaderValidator),
      yellowCards: v.array(seasonPlayerLeaderValidator),
      redCards: v.array(seasonPlayerLeaderValidator),
      penaltiesScored: v.array(seasonPlayerLeaderValidator),
    }),
    teamLeaders: v.object({
      points: v.array(seasonTeamLeaderValidator),
      goalsFor: v.array(seasonTeamLeaderValidator),
      goalsAgainst: v.array(seasonTeamLeaderValidator),
      goalDifference: v.array(seasonTeamLeaderValidator),
      cleanSheets: v.array(seasonTeamLeaderValidator),
    }),
  }),
  handler: getSeasonLeadersHandler,
});

export const getSeasonStatsTable = query({
  args: {
    orgSlug: v.string(),
    seasonId: v.string(),
  },
  returns: v.object({
    season: seasonValidator,
    gamesCount: v.number(),
    players: v.array(seasonPlayerStatsRowValidator),
    teams: v.array(seasonTeamStatsRowValidator),
  }),
  handler: getSeasonStatsTableHandler,
});

export const getById = query({
  args: { gameId: v.id("games") },
  returns: v.union(gameValidator, v.null()),
  handler: getByIdHandler,
});

export const create = mutation({
  args: {
    orgSlug: v.string(),
    seasonId: v.optional(v.string()),
    homeClubId: v.id("clubs"),
    awayClubId: v.id("clubs"),
    date: v.string(),
    startTime: v.string(),
    category: v.string(),
    gender,
    locationName: v.optional(v.string()),
    locationCoordinates: v.optional(v.array(v.number())),
  },
  returns: v.id("games"),
  handler: createGameHandler,
});

export const update = mutation({
  args: {
    gameId: v.id("games"),
    date: v.optional(v.string()),
    startTime: v.optional(v.string()),
    category: v.optional(v.string()),
    gender: v.optional(gender),
    locationName: v.optional(v.string()),
    locationCoordinates: v.optional(v.array(v.number())),
    status: v.optional(gameStatus),
    homeScore: v.optional(v.number()),
    awayScore: v.optional(v.number()),
  },
  returns: v.null(),
  handler: updateGameHandler,
});

export const remove = mutation({
  args: { gameId: v.id("games") },
  returns: v.null(),
  handler: removeGameHandler,
});
