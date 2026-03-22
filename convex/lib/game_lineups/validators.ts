import { v } from "convex/values";

export const lineupPlayerValidator = v.object({
  playerId: v.id("players"),
  playerName: v.string(),
  lastName: v.string(),
  jerseyNumber: v.optional(v.number()),
  cometNumber: v.optional(v.string()),
  photoUrl: v.optional(v.string()),
  position: v.optional(v.string()),
});

export const lineupSlotValidator = v.object({
  id: v.string(),
  x: v.number(),
  y: v.number(),
  role: v.union(v.literal("goalkeeper"), v.literal("outfield")),
  player: v.optional(lineupPlayerValidator),
});

export const lineupValidator = v.object({
  gameId: v.id("games"),
  clubId: v.id("clubs"),
  lineupTemplateId: v.optional(v.string()),
  formation: v.optional(v.string()),
  slots: v.array(lineupSlotValidator),
  starters: v.array(lineupPlayerValidator),
  substitutes: v.array(lineupPlayerValidator),
  updatedAt: v.optional(v.number()),
});

export const rosterPlayerValidator = v.object({
  _id: v.id("players"),
  playerName: v.string(),
  lastName: v.string(),
  jerseyNumber: v.optional(v.number()),
  cometNumber: v.optional(v.string()),
  photoUrl: v.optional(v.string()),
  position: v.optional(v.string()),
});

export const lineupTemplateValidator = v.object({
  id: v.string(),
  name: v.string(),
  slots: v.array(
    v.object({
      id: v.string(),
      x: v.number(),
      y: v.number(),
      role: v.union(v.literal("goalkeeper"), v.literal("outfield")),
    }),
  ),
});

export const editorTeamValidator = v.object({
  clubId: v.id("clubs"),
  teamName: v.string(),
  teamLogoUrl: v.optional(v.string()),
  teamColor: v.optional(v.string()),
  canEdit: v.boolean(),
  lineup: v.union(lineupValidator, v.null()),
  roster: v.array(rosterPlayerValidator),
});

export const lineupMutationInputValidator = v.object({
  clubId: v.id("clubs"),
  lineupTemplateId: v.optional(v.string()),
  formation: v.optional(v.string()),
  slots: v.array(
    v.object({
      id: v.string(),
      x: v.number(),
      y: v.number(),
      role: v.union(v.literal("goalkeeper"), v.literal("outfield")),
      playerId: v.optional(v.id("players")),
    }),
  ),
  starterPlayerIds: v.array(v.id("players")),
  substitutePlayerIds: v.array(v.id("players")),
});
