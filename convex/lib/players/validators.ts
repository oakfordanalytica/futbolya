import { v } from "convex/values";

export const playerStatus = v.union(v.literal("active"), v.literal("inactive"));

export const playerGender = v.union(
  v.literal("male"),
  v.literal("female"),
  v.literal("mixed"),
);

export const dominantProfileValidator = v.union(
  v.literal("left"),
  v.literal("right"),
  v.literal("both"),
);

export const playerViewerAccessLevel = v.union(
  v.literal("superadmin"),
  v.literal("admin"),
  v.literal("coach"),
);

export const playerHighlightValidator = v.object({
  id: v.string(),
  title: v.string(),
  url: v.string(),
  videoId: v.string(),
});

export const playerGameLogRowValidator = v.object({
  gameId: v.id("games"),
  date: v.string(),
  startTime: v.string(),
  gameType: v.union(v.literal("quick"), v.literal("season")),
  teamName: v.string(),
  teamNickname: v.optional(v.string()),
  opponentName: v.string(),
  opponentNickname: v.optional(v.string()),
  result: v.union(v.literal("W"), v.literal("L"), v.literal("—")),
  teamScore: v.optional(v.number()),
  opponentScore: v.optional(v.number()),
  goals: v.number(),
  yellowCards: v.number(),
  redCards: v.number(),
  penaltiesScored: v.number(),
});

export const soccerPlayerValidator = v.object({
  _id: v.id("players"),
  _creationTime: v.number(),
  firstName: v.string(),
  lastName: v.string(),
  secondLastName: v.optional(v.string()),
  photoUrl: v.optional(v.string()),
  dateOfBirth: v.optional(v.string()),
  documentNumber: v.optional(v.string()),
  gender: v.optional(playerGender),
  jerseyNumber: v.optional(v.number()),
  cometNumber: v.optional(v.string()),
  fifaId: v.optional(v.string()),
  position: v.optional(v.string()),
  dominantProfile: v.optional(dominantProfileValidator),
  status: playerStatus,
  height: v.optional(v.number()),
  weight: v.optional(v.number()),
  bioTitle: v.optional(v.string()),
  bioContent: v.optional(v.string()),
  country: v.optional(v.string()),
  categoryId: v.id("categories"),
  categoryName: v.optional(v.string()),
  clubSlug: v.string(),
  clubName: v.string(),
  clubNickname: v.optional(v.string()),
});

export const soccerPlayerDetailValidator = v.object({
  _id: v.id("players"),
  _creationTime: v.number(),
  firstName: v.string(),
  lastName: v.string(),
  secondLastName: v.optional(v.string()),
  photoUrl: v.optional(v.string()),
  dateOfBirth: v.optional(v.string()),
  documentNumber: v.optional(v.string()),
  gender: v.optional(playerGender),
  jerseyNumber: v.optional(v.number()),
  cometNumber: v.optional(v.string()),
  fifaId: v.optional(v.string()),
  position: v.optional(v.string()),
  dominantProfile: v.optional(dominantProfileValidator),
  status: playerStatus,
  height: v.optional(v.number()),
  weight: v.optional(v.number()),
  bioTitle: v.optional(v.string()),
  bioContent: v.optional(v.string()),
  country: v.optional(v.string()),
  categoryId: v.id("categories"),
  categoryName: v.optional(v.string()),
  clubId: v.id("clubs"),
  clubName: v.string(),
  clubSlug: v.string(),
  clubLogoUrl: v.optional(v.string()),
  clubPrimaryColor: v.optional(v.string()),
  highlights: v.array(playerHighlightValidator),
  gamesPlayed: v.number(),
  goals: v.number(),
  yellowCards: v.number(),
  redCards: v.number(),
  penaltiesScored: v.number(),
  viewerAccessLevel: playerViewerAccessLevel,
});
