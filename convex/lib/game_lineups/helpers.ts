import type { MutationCtx, QueryCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import { getCurrentUser } from "../../lib/auth";
import { hasClubStaffAccess, hasOrgAdminAccess } from "../../lib/permissions";
import { buildPlayerFullName } from "@/lib/players/name";

export type LineupCtx = QueryCtx | MutationCtx;

export function normalizeFormation(input?: string) {
  const trimmed = input?.trim();
  return trimmed ? trimmed : undefined;
}

export function ensureUniqueIds(ids: Id<"players">[], label: string) {
  if (new Set(ids).size !== ids.length) {
    throw new Error(`${label} contains duplicate players`);
  }
}

export function buildPlayerName(player: {
  firstName: string;
  lastName: string;
  secondLastName?: string;
}) {
  return buildPlayerFullName(
    player.firstName,
    player.lastName,
    player.secondLastName,
  );
}

export async function buildLineupPlayers(
  ctx: LineupCtx,
  playerIds: Id<"players">[],
) {
  const players = await Promise.all(playerIds.map((playerId) => ctx.db.get(playerId)));

  return await Promise.all(
    players
      .filter((player): player is NonNullable<typeof player> => Boolean(player))
      .map(async (player) => ({
        playerId: player._id,
        playerName: buildPlayerName(player),
        lastName: player.lastName,
        jerseyNumber: player.jerseyNumber,
        cometNumber: player.cometNumber,
        photoUrl: player.photoStorageId
          ? ((await ctx.storage.getUrl(player.photoStorageId)) ?? undefined)
          : undefined,
        position: player.position,
      })),
  );
}

export async function buildRosterPlayers(ctx: LineupCtx, clubId: Id<"clubs">) {
  const players = await ctx.db
    .query("players")
    .withIndex("byClub", (q) => q.eq("clubId", clubId))
    .collect();

  const soccerPlayers = players
    .filter((player) => player.sportType === "soccer" && player.status === "active")
    .sort((a, b) =>
      buildPlayerName(a).localeCompare(buildPlayerName(b), undefined, {
        sensitivity: "base",
      }),
    );

  return await Promise.all(
    soccerPlayers.map(async (player) => ({
      _id: player._id,
      playerName: buildPlayerName(player),
      lastName: player.lastName,
      jerseyNumber: player.jerseyNumber,
      cometNumber: player.cometNumber,
      photoUrl: player.photoStorageId
        ? ((await ctx.storage.getUrl(player.photoStorageId)) ?? undefined)
        : undefined,
      position: player.position,
    })),
  );
}

export async function getGameLineupAccessScope(
  ctx: LineupCtx,
  gameId: Id<"games">,
) {
  const user = await getCurrentUser(ctx);
  const game = await ctx.db.get(gameId);
  if (!game) {
    throw new Error("Game not found");
  }

  const isOrgAdmin = await hasOrgAdminAccess(ctx, user._id, game.organizationId);
  const [canCoachHome, canCoachAway] = await Promise.all([
    hasClubStaffAccess(ctx, user._id, game.homeClubId),
    hasClubStaffAccess(ctx, user._id, game.awayClubId),
  ]);

  if (!isOrgAdmin && !canCoachHome && !canCoachAway) {
    throw new Error("You do not have access to this game");
  }

  return {
    user,
    game,
    canEditHome: isOrgAdmin || canCoachHome,
    canEditAway: isOrgAdmin || canCoachAway,
  };
}

export async function loadLineupRow(
  ctx: LineupCtx,
  gameId: Id<"games">,
  clubId: Id<"clubs">,
) {
  return await ctx.db
    .query("gameLineups")
    .withIndex("byGameAndClub", (q) => q.eq("gameId", gameId).eq("clubId", clubId))
    .unique();
}

export async function buildLineupSlots(
  ctx: LineupCtx,
  slots: {
    id: string;
    x: number;
    y: number;
    role: "goalkeeper" | "outfield";
    playerId?: Id<"players">;
  }[],
) {
  return await Promise.all(
    slots.map(async (slot) => {
      if (!slot.playerId) {
        return {
          id: slot.id,
          x: slot.x,
          y: slot.y,
          role: slot.role,
        };
      }

      const players = await buildLineupPlayers(ctx, [slot.playerId]);
      const player = players[0];

      return {
        id: slot.id,
        x: slot.x,
        y: slot.y,
        role: slot.role,
        ...(player ? { player } : {}),
      };
    }),
  );
}

export async function validateAndPersistLineup(
  ctx: MutationCtx,
  args: {
    gameId: Id<"games">;
    userId: Id<"users">;
    game: {
      homeClubId: Id<"clubs">;
      awayClubId: Id<"clubs">;
    };
    canEditHome: boolean;
    canEditAway: boolean;
    lineup: {
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
    };
  },
) {
  const isHomeTeam = args.lineup.clubId === args.game.homeClubId;
  const isAwayTeam = args.lineup.clubId === args.game.awayClubId;
  if (!isHomeTeam && !isAwayTeam) {
    throw new Error("Club is not part of this game");
  }
  if ((isHomeTeam && !args.canEditHome) || (isAwayTeam && !args.canEditAway)) {
    throw new Error("You do not have permission to edit this lineup");
  }

  ensureUniqueIds(args.lineup.starterPlayerIds, "Starters");
  ensureUniqueIds(args.lineup.substitutePlayerIds, "Substitutes");

  const allPlayerIds = [
    ...args.lineup.starterPlayerIds,
    ...args.lineup.substitutePlayerIds,
  ];
  if (new Set(allPlayerIds).size !== allPlayerIds.length) {
    throw new Error("A player cannot be in starters and substitutes at the same time");
  }
  if (args.lineup.starterPlayerIds.length > 11) {
    throw new Error("Starters cannot exceed 11 players");
  }

  if (args.lineup.slots.length > 0) {
    const slotPlayerIds = args.lineup.slots
      .map((slot) => slot.playerId)
      .filter((playerId): playerId is Id<"players"> => Boolean(playerId));
    if (new Set(slotPlayerIds).size !== slotPlayerIds.length) {
      throw new Error("A player cannot be assigned to more than one slot");
    }
    if (slotPlayerIds.length !== args.lineup.starterPlayerIds.length) {
      throw new Error("Starter players must match the assigned lineup slots");
    }
    const starterSet = new Set(args.lineup.starterPlayerIds);
    const slotSet = new Set(slotPlayerIds);
    if (
      starterSet.size !== slotSet.size ||
      [...starterSet].some((playerId) => !slotSet.has(playerId))
    ) {
      throw new Error("Starter players must match the assigned lineup slots");
    }
  }

  const players = await Promise.all(allPlayerIds.map((playerId) => ctx.db.get(playerId)));
  for (const player of players) {
    if (!player || player.clubId !== args.lineup.clubId || player.sportType !== "soccer") {
      throw new Error("One or more selected players do not belong to this team");
    }
  }

  const payload = {
    gameId: args.gameId,
    clubId: args.lineup.clubId,
    lineupTemplateId: args.lineup.lineupTemplateId,
    formation: normalizeFormation(args.lineup.formation),
    slots: args.lineup.slots,
    starterPlayerIds: args.lineup.starterPlayerIds,
    substitutePlayerIds: args.lineup.substitutePlayerIds,
    updatedBy: args.userId,
    updatedAt: Date.now(),
  };

  const existing = await loadLineupRow(ctx, args.gameId, args.lineup.clubId);
  if (existing) {
    await ctx.db.patch(existing._id, payload);
  } else {
    await ctx.db.insert("gameLineups", payload);
  }
}
