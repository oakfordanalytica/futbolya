import { v } from "convex/values";
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
  args: {},
  returns: v.string(),
  handler: generatePlayerUploadUrlHandler,
});

export const createPlayer = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    secondLastName: v.string(),
    photoStorageId: v.optional(v.id("_storage")),
    dateOfBirth: v.string(),
    documentNumber: v.string(),
    gender: playerGender,
    jerseyNumber: v.optional(v.number()),
    categoryId: v.id("categories"),
    cometNumber: v.string(),
    fifaId: v.optional(v.string()),
    position: v.optional(v.string()),
    dominantProfile: dominantProfileValidator,
    height: v.optional(v.number()),
    weight: v.optional(v.number()),
    country: v.optional(v.string()),
  },
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
    categoryId: v.optional(v.id("categories")),
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
