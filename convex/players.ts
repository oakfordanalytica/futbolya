import { v } from "convex/values";
import {
  getPlayerManagementContextHandler,
  importPlayersHandler,
} from "./lib/players/import";
import { mutation, query } from "./_generated/server";
import {
  addPlayerHighlightHandler,
  createPlayerHandler,
  deletePlayerHandler,
  generatePlayerUploadUrlHandler,
  removePlayerHighlightHandler,
  updatePlayerBioHandler,
  updatePlayerHandler,
  updatePlayerHighlightHandler,
} from "./lib/players/mutations";
import {
  getSoccerPlayerDetailByClubSlugHandler,
  listSoccerPlayerGameLogHandler,
  listSoccerPlayersByClubSlugHandler,
  listSoccerPlayersByLeagueSlugHandler,
} from "./lib/players/queries";
import {
  dominantProfileValidator,
  createPlayerArgs,
  importPlayersArgs,
  playerGameLogRowValidator,
  playerGender,
  playerHighlightValidator,
  playerStatus,
  soccerPlayerDetailValidator,
  soccerPlayerValidator,
} from "./lib/players/validators";

export const listSoccerPlayersByClubSlug = query({
  args: { clubSlug: v.string() },
  returns: v.array(soccerPlayerValidator),
  handler: listSoccerPlayersByClubSlugHandler,
});

export const listSoccerPlayersByLeagueSlug = query({
  args: { leagueSlug: v.string() },
  returns: v.array(soccerPlayerValidator),
  handler: listSoccerPlayersByLeagueSlugHandler,
});

export const getSoccerPlayerDetailByClubSlug = query({
  args: {
    clubSlug: v.string(),
    playerId: v.id("players"),
  },
  returns: v.union(soccerPlayerDetailValidator, v.null()),
  handler: getSoccerPlayerDetailByClubSlugHandler,
});

export const listSoccerPlayerGameLog = query({
  args: {
    playerId: v.id("players"),
    limit: v.optional(v.number()),
  },
  returns: v.array(playerGameLogRowValidator),
  handler: listSoccerPlayerGameLogHandler,
});

export const generateUploadUrl = mutation({
  args: { clubSlug: v.string() },
  returns: v.string(),
  handler: generatePlayerUploadUrlHandler,
});

export const getPlayerManagementContext = query({
  args: { organizationSlug: v.string(), clubSlug: v.string() },
  returns: v.union(
    v.object({ clubId: v.id("clubs"), clubName: v.string() }),
    v.null(),
  ),
  handler: getPlayerManagementContextHandler,
});

export const importPlayers = mutation({
  args: importPlayersArgs,
  returns: v.object({
    imported: v.number(),
    skipped: v.array(
      v.object({
        sourceRow: v.number(),
        reason: v.union(v.literal("existing"), v.literal("conflict")),
      }),
    ),
  }),
  handler: importPlayersHandler,
});

export const createPlayer = mutation({
  args: createPlayerArgs,
  returns: v.id("players"),
  handler: createPlayerHandler,
});

export const deletePlayer = mutation({
  args: { playerId: v.id("players") },
  returns: v.null(),
  handler: deletePlayerHandler,
});

export const updatePlayer = mutation({
  args: {
    playerId: v.id("players"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    secondLastName: v.optional(v.string()),
    photoStorageId: v.optional(v.id("_storage")),
    dateOfBirth: v.optional(v.string()),
    documentNumber: v.optional(v.string()),
    gender: v.optional(playerGender),
    jerseyNumber: v.optional(v.number()),
    cometNumber: v.optional(v.string()),
    fifaId: v.optional(v.string()),
    position: v.optional(v.string()),
    dominantProfile: v.optional(dominantProfileValidator),
    height: v.optional(v.number()),
    weight: v.optional(v.number()),
    country: v.optional(v.string()),
    status: v.optional(playerStatus),
    leagueCategoryId: v.optional(v.string()),
    division: v.optional(v.string()),
  },
  returns: v.null(),
  handler: updatePlayerHandler,
});

export const updatePlayerBio = mutation({
  args: {
    playerId: v.id("players"),
    bioTitle: v.string(),
    bioContent: v.string(),
  },
  returns: v.null(),
  handler: updatePlayerBioHandler,
});

export const addPlayerHighlight = mutation({
  args: {
    playerId: v.id("players"),
    title: v.string(),
    url: v.string(),
  },
  returns: v.null(),
  handler: addPlayerHighlightHandler,
});

export const updatePlayerHighlight = mutation({
  args: {
    playerId: v.id("players"),
    highlightId: v.string(),
    title: v.string(),
    url: v.string(),
  },
  returns: v.null(),
  handler: updatePlayerHighlightHandler,
});

export const removePlayerHighlight = mutation({
  args: {
    playerId: v.id("players"),
    highlightId: v.string(),
  },
  returns: v.null(),
  handler: removePlayerHighlightHandler,
});
