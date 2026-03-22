import { v } from "convex/values";

export const gender = v.union(
  v.literal("male"),
  v.literal("female"),
  v.literal("mixed"),
);

export const sportType = v.literal("soccer");

export const ageCategoryValidator = v.object({
  id: v.string(),
  name: v.string(),
  minAge: v.number(),
  maxAge: v.number(),
});

export const positionValidator = v.object({
  id: v.string(),
  name: v.string(),
  abbreviation: v.string(),
});

export const seasonValidator = v.object({
  id: v.string(),
  name: v.string(),
  startDate: v.string(),
  endDate: v.string(),
});

export const lineupSlotValidator = v.object({
  id: v.string(),
  x: v.number(),
  y: v.number(),
  role: v.union(v.literal("goalkeeper"), v.literal("outfield")),
});

export const lineupTemplateValidator = v.object({
  id: v.string(),
  name: v.string(),
  slots: v.array(lineupSlotValidator),
});

export const horizontalDivisionsValidator = v.object({
  enabled: v.boolean(),
  type: v.union(
    v.literal("alphabetic"),
    v.literal("greek"),
    v.literal("numeric"),
  ),
});

export const teamConfigValidator = v.object({
  sportType,
  ageCategories: v.array(ageCategoryValidator),
  positions: v.array(positionValidator),
  lineups: v.array(lineupTemplateValidator),
  enabledGenders: v.array(gender),
  horizontalDivisions: v.optional(horizontalDivisionsValidator),
});

export const leagueSettingsValidator = v.object({
  _id: v.id("leagueSettings"),
  _creationTime: v.number(),
  organizationId: v.id("organizations"),
  sportType,
  ageCategories: v.array(ageCategoryValidator),
  positions: v.optional(v.array(positionValidator)),
  lineups: v.optional(v.array(lineupTemplateValidator)),
  enabledGenders: v.array(gender),
  seasons: v.optional(v.array(seasonValidator)),
  horizontalDivisions: v.optional(horizontalDivisionsValidator),
});
