import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  saveGameLineupsEditorDataHandler,
  upsertGameLineupHandler,
} from "./lib/game_lineups/mutations";
import {
  getGameLineupsByGameIdHandler,
  getGameLineupsEditorDataHandler,
} from "./lib/game_lineups/queries";
import {
  editorTeamValidator,
  lineupMutationInputValidator,
  lineupTemplateValidator,
  lineupValidator,
} from "./lib/game_lineups/validators";

export const getByGameId = query({
  args: { gameId: v.id("games") },
  returns: v.object({
    homeLineup: v.union(lineupValidator, v.null()),
    awayLineup: v.union(lineupValidator, v.null()),
    canEditHome: v.boolean(),
    canEditAway: v.boolean(),
  }),
  handler: getGameLineupsByGameIdHandler,
});

export const getEditorData = query({
  args: { gameId: v.id("games") },
  returns: v.object({
    availableLineups: v.array(lineupTemplateValidator),
    homeTeam: editorTeamValidator,
    awayTeam: editorTeamValidator,
  }),
  handler: getGameLineupsEditorDataHandler,
});

export const upsert = mutation({
  args: {
    gameId: v.id("games"),
    ...lineupMutationInputValidator.fields,
  },
  returns: v.null(),
  handler: upsertGameLineupHandler,
});

export const saveEditorData = mutation({
  args: {
    gameId: v.id("games"),
    lineups: v.array(lineupMutationInputValidator),
  },
  returns: v.null(),
  handler: saveGameLineupsEditorDataHandler,
});
