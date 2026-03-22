import { v } from "convex/values";

export const gameEventType = v.union(
  v.literal("goal"),
  v.literal("yellow_card"),
  v.literal("red_card"),
  v.literal("substitution"),
  v.literal("penalty_scored"),
  v.literal("penalty_missed"),
);

export const timelineEventValidator = v.object({
  id: v.id("gameEvents"),
  side: v.union(v.literal("home"), v.literal("away")),
  type: gameEventType,
  minute: v.number(),
  playerId: v.id("players"),
  relatedPlayerId: v.optional(v.id("players")),
  primaryText: v.string(),
  secondaryText: v.optional(v.string()),
});

export const editorPlayerValidator = v.object({
  _id: v.id("players"),
  clubId: v.id("clubs"),
  teamName: v.string(),
  playerName: v.string(),
  jerseyNumber: v.optional(v.number()),
  cometNumber: v.optional(v.string()),
});

export const editorClubStateValidator = v.object({
  clubId: v.id("clubs"),
  onFieldPlayerIds: v.array(v.id("players")),
});

export const registerEventInputValidator = v.object({
  playerId: v.id("players"),
  relatedPlayerId: v.optional(v.id("players")),
  eventType: gameEventType,
});
