import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  addAgeCategoryHandler,
  removeAgeCategoryHandler,
  updateAgeCategoryHandler,
} from "./lib/league_settings/age_categories";
import {
  gender,
  ageCategoryValidator,
  horizontalDivisionsValidator,
  leagueSettingsValidator,
  lineupSlotValidator,
  lineupTemplateValidator,
  positionValidator,
  seasonValidator,
  sportType,
  teamConfigValidator,
} from "./lib/league_settings/validators";
import {
  getByLeagueSlugHandler,
  getTeamConfigHandler,
  listActiveSeasonsHandler,
  listSeasonsHandler,
} from "./lib/league_settings/queries";
import {
  upsertLeagueSettingsHandler,
  updateEnabledGendersHandler,
  updateHorizontalDivisionsHandler,
} from "./lib/league_settings/general";
import {
  addPositionHandler,
  removePositionHandler,
  updatePositionHandler,
} from "./lib/league_settings/positions";
import {
  addSeasonHandler,
  removeSeasonHandler,
  updateSeasonHandler,
} from "./lib/league_settings/seasons";
import {
  addLineupHandler,
  removeLineupHandler,
  updateLineupHandler,
} from "./lib/league_settings/lineups";

export const getTeamConfig = query({
  args: { leagueSlug: v.string() },
  returns: v.union(teamConfigValidator, v.null()),
  handler: getTeamConfigHandler,
});

export const getByLeagueSlug = query({
  args: { leagueSlug: v.string() },
  returns: v.union(leagueSettingsValidator, v.null()),
  handler: getByLeagueSlugHandler,
});

export const listSeasons = query({
  args: { leagueSlug: v.string() },
  returns: v.array(seasonValidator),
  handler: listSeasonsHandler,
});

export const listActiveSeasons = query({
  args: { leagueSlug: v.string() },
  returns: v.array(seasonValidator),
  handler: listActiveSeasonsHandler,
});

export const upsert = mutation({
  args: {
    leagueSlug: v.string(),
    sportType,
    ageCategories: v.array(ageCategoryValidator),
    positions: v.array(positionValidator),
    lineups: v.optional(v.array(lineupTemplateValidator)),
    enabledGenders: v.array(gender),
    horizontalDivisions: v.optional(horizontalDivisionsValidator),
  },
  returns: v.id("leagueSettings"),
  handler: upsertLeagueSettingsHandler,
});

export const addAgeCategory = mutation({
  args: {
    leagueSlug: v.string(),
    category: ageCategoryValidator,
  },
  returns: v.null(),
  handler: addAgeCategoryHandler,
});

export const removeAgeCategory = mutation({
  args: {
    leagueSlug: v.string(),
    categoryId: v.string(),
  },
  returns: v.null(),
  handler: removeAgeCategoryHandler,
});

export const updateAgeCategory = mutation({
  args: {
    leagueSlug: v.string(),
    categoryId: v.string(),
    name: v.string(),
    minAge: v.number(),
    maxAge: v.number(),
  },
  returns: v.null(),
  handler: updateAgeCategoryHandler,
});

export const updateEnabledGenders = mutation({
  args: {
    leagueSlug: v.string(),
    enabledGenders: v.array(gender),
  },
  returns: v.null(),
  handler: updateEnabledGendersHandler,
});

export const updateHorizontalDivisions = mutation({
  args: {
    leagueSlug: v.string(),
    horizontalDivisions: v.optional(horizontalDivisionsValidator),
  },
  returns: v.null(),
  handler: updateHorizontalDivisionsHandler,
});

export const addPosition = mutation({
  args: {
    leagueSlug: v.string(),
    position: positionValidator,
  },
  returns: v.null(),
  handler: addPositionHandler,
});

export const removePosition = mutation({
  args: {
    leagueSlug: v.string(),
    positionId: v.string(),
  },
  returns: v.null(),
  handler: removePositionHandler,
});

export const updatePosition = mutation({
  args: {
    leagueSlug: v.string(),
    positionId: v.string(),
    name: v.string(),
    abbreviation: v.string(),
  },
  returns: v.null(),
  handler: updatePositionHandler,
});

export const addSeason = mutation({
  args: {
    leagueSlug: v.string(),
    season: seasonValidator,
  },
  returns: v.null(),
  handler: addSeasonHandler,
});

export const removeSeason = mutation({
  args: {
    leagueSlug: v.string(),
    seasonId: v.string(),
  },
  returns: v.null(),
  handler: removeSeasonHandler,
});

export const updateSeason = mutation({
  args: {
    leagueSlug: v.string(),
    seasonId: v.string(),
    name: v.string(),
    startDate: v.string(),
    endDate: v.string(),
  },
  returns: v.null(),
  handler: updateSeasonHandler,
});

export const addLineup = mutation({
  args: {
    leagueSlug: v.string(),
    lineup: lineupTemplateValidator,
  },
  returns: v.null(),
  handler: addLineupHandler,
});

export const updateLineup = mutation({
  args: {
    leagueSlug: v.string(),
    lineupId: v.string(),
    name: v.string(),
    slots: v.array(lineupSlotValidator),
  },
  returns: v.null(),
  handler: updateLineupHandler,
});

export const removeLineup = mutation({
  args: {
    leagueSlug: v.string(),
    lineupId: v.string(),
  },
  returns: v.null(),
  handler: removeLineupHandler,
});
