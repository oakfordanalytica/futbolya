import type { MutationCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import {
  buildCurrentOnFieldByClub,
  getGameEventAccessScope,
  registerEventAndSync,
} from "./helpers";

function assertValidMinute(minute: number) {
  if (!Number.isFinite(minute) || minute < 1 || minute > 130) {
    throw new Error("Minute must be between 1 and 130");
  }
}

export async function registerGameEventHandler(
  ctx: MutationCtx,
  args: {
    gameId: Id<"games">;
    playerId: Id<"players">;
    relatedPlayerId?: Id<"players">;
    minute: number;
    eventType:
      | "goal"
      | "yellow_card"
      | "red_card"
      | "substitution"
      | "penalty_scored"
      | "penalty_missed";
  },
) {
  const { user, game, isOrgAdmin } = await getGameEventAccessScope(ctx, args.gameId);
  if (!isOrgAdmin) {
    throw new Error("Admin access required for match events");
  }

  const currentOnFieldByClub = await buildCurrentOnFieldByClub(ctx, args.gameId, [
    game.homeClubId,
    game.awayClubId,
  ]);

  assertValidMinute(args.minute);

  return await registerEventAndSync(ctx, {
    gameId: args.gameId,
    minute: args.minute,
    playerId: args.playerId,
    relatedPlayerId: args.relatedPlayerId,
    eventType: args.eventType,
    userId: user._id,
    game,
    canManageHome: true,
    canManageAway: true,
    currentOnFieldByClub,
  });
}

export async function registerGameEventBatchHandler(
  ctx: MutationCtx,
  args: {
    gameId: Id<"games">;
    minute: number;
    events: Array<{
      playerId: Id<"players">;
      relatedPlayerId?: Id<"players">;
      eventType:
        | "goal"
        | "yellow_card"
        | "red_card"
        | "substitution"
        | "penalty_scored"
        | "penalty_missed";
    }>;
  },
) {
  const { user, game, isOrgAdmin } = await getGameEventAccessScope(ctx, args.gameId);
  if (!isOrgAdmin) {
    throw new Error("Admin access required for match events");
  }

  const currentOnFieldByClub = await buildCurrentOnFieldByClub(ctx, args.gameId, [
    game.homeClubId,
    game.awayClubId,
  ]);

  assertValidMinute(args.minute);
  if (args.events.length === 0) {
    throw new Error("At least one event is required");
  }

  const eventIds: Id<"gameEvents">[] = [];
  for (const event of args.events) {
    const eventId = await registerEventAndSync(ctx, {
      gameId: args.gameId,
      minute: args.minute,
      playerId: event.playerId,
      relatedPlayerId: event.relatedPlayerId,
      eventType: event.eventType,
      userId: user._id,
      game,
      canManageHome: true,
      canManageAway: true,
      currentOnFieldByClub,
    });
    eventIds.push(eventId);
  }

  return eventIds;
}
