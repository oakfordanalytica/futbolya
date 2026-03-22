import type { MutationCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import { getGameLineupAccessScope, validateAndPersistLineup } from "./helpers";

export async function upsertGameLineupHandler(
  ctx: MutationCtx,
  args: {
    gameId: Id<"games">;
    clubId: Id<"clubs">;
    lineupTemplateId?: string;
    formation?: string;
    slots: {
      id: string;
      x: number;
      y: number;
      role: "goalkeeper" | "outfield";
      playerId?: Id<"players">;
    }[];
    starterPlayerIds: Id<"players">[];
    substitutePlayerIds: Id<"players">[];
  },
) {
  const { user, game, canEditHome, canEditAway } = await getGameLineupAccessScope(
    ctx,
    args.gameId,
  );

  await validateAndPersistLineup(ctx, {
    gameId: args.gameId,
    userId: user._id,
    game,
    canEditHome,
    canEditAway,
    lineup: args,
  });

  return null;
}

export async function saveGameLineupsEditorDataHandler(
  ctx: MutationCtx,
  args: {
    gameId: Id<"games">;
    lineups: Array<{
      clubId: Id<"clubs">;
      lineupTemplateId?: string;
      formation?: string;
      slots: {
        id: string;
        x: number;
        y: number;
        role: "goalkeeper" | "outfield";
        playerId?: Id<"players">;
      }[];
      starterPlayerIds: Id<"players">[];
      substitutePlayerIds: Id<"players">[];
    }>;
  },
) {
  const { user, game, canEditHome, canEditAway } = await getGameLineupAccessScope(
    ctx,
    args.gameId,
  );

  if (args.lineups.length === 0) {
    throw new Error("No lineups to save");
  }

  const clubIds = args.lineups.map((lineup) => lineup.clubId);
  if (new Set(clubIds).size !== clubIds.length) {
    throw new Error("Each team lineup can only be submitted once");
  }

  for (const lineup of args.lineups) {
    await validateAndPersistLineup(ctx, {
      gameId: args.gameId,
      userId: user._id,
      game,
      canEditHome,
      canEditAway,
      lineup,
    });
  }

  return null;
}
