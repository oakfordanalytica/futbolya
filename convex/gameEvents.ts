import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  registerGameEventBatchHandler,
  registerGameEventHandler,
} from "./lib/game_events/mutations";
import {
  getGameEventsByGameIdHandler,
  getGameEventsEditorDataHandler,
} from "./lib/game_events/queries";
import {
  editorClubStateValidator,
  editorPlayerValidator,
  gameEventType,
  registerEventInputValidator,
  timelineEventValidator,
} from "./lib/game_events/validators";

export const getByGameId = query({
  args: { gameId: v.id("games") },
  returns: v.object({
    canManageEvents: v.boolean(),
    events: v.array(timelineEventValidator),
  }),
  handler: getGameEventsByGameIdHandler,
});

export const getEditorData = query({
  args: { gameId: v.id("games") },
  returns: v.object({
    canManageEvents: v.boolean(),
    players: v.array(editorPlayerValidator),
    clubStates: v.array(editorClubStateValidator),
  }),
  handler: getGameEventsEditorDataHandler,
});

export const register = mutation({
  args: {
    gameId: v.id("games"),
    playerId: v.id("players"),
    relatedPlayerId: v.optional(v.id("players")),
    minute: v.number(),
    eventType: gameEventType,
  },
  returns: v.id("gameEvents"),
  handler: registerGameEventHandler,
});

export const registerBatch = mutation({
  args: {
    gameId: v.id("games"),
    minute: v.number(),
    events: v.array(registerEventInputValidator),
  },
  returns: v.array(v.id("gameEvents")),
  handler: registerGameEventBatchHandler,
});
