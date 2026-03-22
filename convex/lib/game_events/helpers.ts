import type { MutationCtx, QueryCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import { getCurrentUser } from "../../lib/auth";
import { hasClubStaffAccess, hasOrgAdminAccess } from "../../lib/permissions";
import { buildPlayerFullName } from "@/lib/players/name";
import {
  applySubstitutionEvent,
  getEventStatEffects,
  resolveSubstitutionDirection,
  type PlayerStatIncrements,
  type TeamStatIncrements,
} from "@/lib/soccer/stats-domain";

export type EventCtx = QueryCtx | MutationCtx;

export async function getGameEventAccessScope(
  ctx: EventCtx,
  gameId: Id<"games">,
) {
  const user = await getCurrentUser(ctx);
  const game = await ctx.db.get(gameId);
  if (!game) {
    throw new Error("Game not found");
  }

  const isOrgAdmin = await hasOrgAdminAccess(ctx, user._id, game.organizationId);
  const [canManageHome, canManageAway] = await Promise.all([
    hasClubStaffAccess(ctx, user._id, game.homeClubId),
    hasClubStaffAccess(ctx, user._id, game.awayClubId),
  ]);

  if (!isOrgAdmin && !canManageHome && !canManageAway) {
    throw new Error("You do not have access to this game");
  }

  return {
    user,
    game,
    isOrgAdmin,
    canAccessHome: isOrgAdmin || canManageHome,
    canAccessAway: isOrgAdmin || canManageAway,
  };
}

export function buildPlayerStatIncrementPatch(
  current: {
    goals?: number;
    yellowCards?: number;
    redCards?: number;
    penaltiesAttempted?: number;
    penaltiesScored?: number;
    substitutionsIn?: number;
    substitutionsOut?: number;
  },
  increments: PlayerStatIncrements,
) {
  const patch: Record<string, number> = {};

  if (increments.goals !== undefined) {
    patch.goals = (current.goals ?? 0) + increments.goals;
  }
  if (increments.yellowCards !== undefined) {
    patch.yellowCards = (current.yellowCards ?? 0) + increments.yellowCards;
  }
  if (increments.redCards !== undefined) {
    patch.redCards = (current.redCards ?? 0) + increments.redCards;
  }
  if (increments.penaltiesAttempted !== undefined) {
    patch.penaltiesAttempted =
      (current.penaltiesAttempted ?? 0) + increments.penaltiesAttempted;
  }
  if (increments.penaltiesScored !== undefined) {
    patch.penaltiesScored =
      (current.penaltiesScored ?? 0) + increments.penaltiesScored;
  }
  if (increments.substitutionsIn !== undefined) {
    patch.substitutionsIn =
      (current.substitutionsIn ?? 0) + increments.substitutionsIn;
  }
  if (increments.substitutionsOut !== undefined) {
    patch.substitutionsOut =
      (current.substitutionsOut ?? 0) + increments.substitutionsOut;
  }

  return patch;
}

export function buildTeamStatIncrementPatch(
  current: { substitutions?: number },
  increments: TeamStatIncrements,
) {
  const patch: Record<string, number> = {};

  if (increments.substitutions !== undefined) {
    patch.substitutions =
      (current.substitutions ?? 0) + increments.substitutions;
  }

  return patch;
}

async function isPlayerStarterForGame(
  ctx: MutationCtx,
  gameId: Id<"games">,
  clubId: Id<"clubs">,
  playerId: Id<"players">,
) {
  const lineup = await ctx.db
    .query("gameLineups")
    .withIndex("byGameAndClub", (q) => q.eq("gameId", gameId).eq("clubId", clubId))
    .unique();

  return Boolean(lineup?.starterPlayerIds.some((id) => id === playerId));
}

export async function incrementPlayerStatsRow(
  ctx: MutationCtx,
  args: {
    gameId: Id<"games">;
    clubId: Id<"clubs">;
    playerId: Id<"players">;
    increments: PlayerStatIncrements;
  },
) {
  const existingStats = await ctx.db
    .query("gamePlayerStats")
    .withIndex("byGameAndClub", (q) => q.eq("gameId", args.gameId).eq("clubId", args.clubId))
    .collect();

  const existing = existingStats.find((stat) => stat.playerId === args.playerId);
  if (existing) {
    await ctx.db.patch(
      existing._id,
      buildPlayerStatIncrementPatch(existing, args.increments),
    );
    return;
  }

  const isStarter = await isPlayerStarterForGame(
    ctx,
    args.gameId,
    args.clubId,
    args.playerId,
  );

  await ctx.db.insert("gamePlayerStats", {
    gameId: args.gameId,
    playerId: args.playerId,
    clubId: args.clubId,
    isStarter,
    ...buildPlayerStatIncrementPatch({}, args.increments),
  });
}

export async function incrementTeamStatsRow(
  ctx: MutationCtx,
  args: {
    gameId: Id<"games">;
    clubId: Id<"clubs">;
    increments: TeamStatIncrements;
  },
) {
  const existing = await ctx.db
    .query("gameTeamStats")
    .withIndex("byGameAndClub", (q) => q.eq("gameId", args.gameId).eq("clubId", args.clubId))
    .unique();

  if (existing) {
    await ctx.db.patch(
      existing._id,
      buildTeamStatIncrementPatch(existing, args.increments),
    );
    return;
  }

  await ctx.db.insert("gameTeamStats", {
    gameId: args.gameId,
    clubId: args.clubId,
    ...buildTeamStatIncrementPatch({}, args.increments),
  });
}

export async function incrementGameScore(
  ctx: MutationCtx,
  args: {
    game: {
      _id: Id<"games">;
      homeClubId: Id<"clubs">;
      awayClubId: Id<"clubs">;
      homeScore?: number;
      awayScore?: number;
    };
    scoringClubId: Id<"clubs">;
  },
) {
  const baseHomeScore = args.game.homeScore ?? 0;
  const baseAwayScore = args.game.awayScore ?? 0;

  if (args.scoringClubId === args.game.homeClubId) {
    await ctx.db.patch(args.game._id, {
      homeScore: baseHomeScore + 1,
      awayScore: baseAwayScore,
    });
    return;
  }

  if (args.scoringClubId === args.game.awayClubId) {
    await ctx.db.patch(args.game._id, {
      homeScore: baseHomeScore,
      awayScore: baseAwayScore + 1,
    });
  }
}

async function getInitialOnFieldPlayerIdsForClub(
  ctx: EventCtx,
  gameId: Id<"games">,
  clubId: Id<"clubs">,
) {
  const lineup = await ctx.db
    .query("gameLineups")
    .withIndex("byGameAndClub", (q) => q.eq("gameId", gameId).eq("clubId", clubId))
    .unique();

  const slotPlayerIds =
    lineup?.slots
      ?.map((slot) => slot.playerId)
      .filter((playerId): playerId is Id<"players"> => Boolean(playerId)) ?? [];

  if (slotPlayerIds.length > 0) {
    return slotPlayerIds;
  }
  if ((lineup?.starterPlayerIds.length ?? 0) > 0) {
    return lineup!.starterPlayerIds;
  }

  const statRows = await ctx.db
    .query("gamePlayerStats")
    .withIndex("byGameAndClub", (q) => q.eq("gameId", gameId).eq("clubId", clubId))
    .collect();

  const starterStatIds = statRows
    .filter((stat) => stat.isStarter)
    .map((stat) => stat.playerId);

  return starterStatIds.length > 0 ? starterStatIds : [];
}

export async function buildCurrentOnFieldByClub(
  ctx: EventCtx,
  gameId: Id<"games">,
  clubIds: Id<"clubs">[],
) {
  const clubEntries: Array<[Id<"clubs">, Set<Id<"players">>]> = await Promise.all(
    clubIds.map(
      async (clubId) =>
        [
          clubId,
          new Set(await getInitialOnFieldPlayerIdsForClub(ctx, gameId, clubId)),
        ] as [Id<"clubs">, Set<Id<"players">>],
    ),
  );

  const currentOnFieldByClub = new Map<Id<"clubs">, Set<Id<"players">>>(
    clubEntries,
  );

  const existingEvents = await ctx.db
    .query("gameEvents")
    .withIndex("byGame", (q) => q.eq("gameId", gameId))
    .collect();

  const sortedEvents = existingEvents.sort((a, b) => {
    if (a.minute !== b.minute) {
      return a.minute - b.minute;
    }
    return a._creationTime - b._creationTime;
  });

  for (const event of sortedEvents) {
    if (event.eventType !== "substitution" || !event.relatedPlayerId) {
      continue;
    }

    const currentOnField = currentOnFieldByClub.get(event.clubId);
    if (!currentOnField) {
      continue;
    }

    const resolvedDirection = resolveSubstitutionDirection(currentOnField, {
      playerId: event.playerId,
      relatedPlayerId: event.relatedPlayerId,
    });

    if (!resolvedDirection) {
      continue;
    }

    currentOnField.delete(resolvedDirection.outgoingPlayerId);
    currentOnField.add(resolvedDirection.incomingPlayerId);
  }

  return currentOnFieldByClub;
}

export async function registerEventAndSync(
  ctx: MutationCtx,
  args: {
    gameId: Id<"games">;
    minute: number;
    playerId: Id<"players">;
    relatedPlayerId?: Id<"players">;
    eventType:
      | "goal"
      | "yellow_card"
      | "red_card"
      | "substitution"
      | "penalty_scored"
      | "penalty_missed";
    userId: Id<"users">;
    game: {
      _id: Id<"games">;
      organizationId: Id<"organizations">;
      homeClubId: Id<"clubs">;
      awayClubId: Id<"clubs">;
      homeScore?: number;
      awayScore?: number;
    };
    canManageHome: boolean;
    canManageAway: boolean;
    currentOnFieldByClub: Map<Id<"clubs">, Set<Id<"players">>>;
  },
) {
  const player = await ctx.db.get(args.playerId);
  if (!player) {
    throw new Error("Player not found");
  }
  if (player.status !== "active" || player.sportType !== "soccer") {
    throw new Error("Player is not eligible for match events");
  }

  const isHomePlayer = player.clubId === args.game.homeClubId;
  const isAwayPlayer = player.clubId === args.game.awayClubId;
  if (!isHomePlayer && !isAwayPlayer) {
    throw new Error("Player does not belong to a team in this game");
  }
  if ((isHomePlayer && !args.canManageHome) || (isAwayPlayer && !args.canManageAway)) {
    throw new Error("You do not have permission to register events for this team");
  }

  const playerName = buildPlayerFullName(
    player.firstName,
    player.lastName,
    player.secondLastName,
  );
  let relatedPlayerId: Id<"players"> | undefined;
  let relatedPlayerName: string | undefined;
  const currentClubOnField =
    args.currentOnFieldByClub.get(player.clubId) ?? new Set<Id<"players">>();
  const hasTrackedOnField = currentClubOnField.size > 0;

  if (args.eventType === "substitution") {
    if (!args.relatedPlayerId) {
      throw new Error("Substitution events require the incoming player");
    }

    const relatedPlayer = await ctx.db.get(args.relatedPlayerId);
    if (!relatedPlayer) {
      throw new Error("Related player not found");
    }
    if (relatedPlayer.status !== "active" || relatedPlayer.sportType !== "soccer") {
      throw new Error("Related player is not eligible for match events");
    }
    if (relatedPlayer.clubId !== player.clubId) {
      throw new Error("Substitution players must belong to the same team");
    }
    if (relatedPlayer._id === player._id) {
      throw new Error("A player cannot replace themselves");
    }

    relatedPlayerId = relatedPlayer._id;
    relatedPlayerName = buildPlayerFullName(
      relatedPlayer.firstName,
      relatedPlayer.lastName,
      relatedPlayer.secondLastName,
    );

    if (hasTrackedOnField) {
      if (!currentClubOnField.has(player._id)) {
        throw new Error("Outgoing player must currently be on the field");
      }
      if (currentClubOnField.has(relatedPlayerId)) {
        throw new Error("Incoming player is already on the field");
      }
    }
  } else if (args.relatedPlayerId) {
    throw new Error("This event type does not support a related player");
  } else if (hasTrackedOnField && !currentClubOnField.has(player._id)) {
    throw new Error("Selected player is not currently on the field");
  }

  const eventId = await ctx.db.insert("gameEvents", {
    gameId: args.gameId,
    organizationId: args.game.organizationId,
    clubId: player.clubId,
    playerId: player._id,
    playerName,
    relatedPlayerId,
    relatedPlayerName,
    minute: Math.trunc(args.minute),
    eventType: args.eventType,
    createdByUserId: args.userId,
  });

  const effects = getEventStatEffects(args.eventType);

  if (effects.primaryPlayer) {
    await incrementPlayerStatsRow(ctx, {
      gameId: args.gameId,
      clubId: player.clubId,
      playerId: player._id,
      increments: effects.primaryPlayer,
    });
  }
  if (effects.relatedPlayer && relatedPlayerId) {
    await incrementPlayerStatsRow(ctx, {
      gameId: args.gameId,
      clubId: player.clubId,
      playerId: relatedPlayerId,
      increments: effects.relatedPlayer,
    });
  }
  if (effects.team) {
    await incrementTeamStatsRow(ctx, {
      gameId: args.gameId,
      clubId: player.clubId,
      increments: effects.team,
    });
  }
  if (effects.scoreDelta) {
    await incrementGameScore(ctx, {
      game: args.game,
      scoringClubId: player.clubId,
    });
  }
  if (args.eventType === "substitution" && relatedPlayerId) {
    applySubstitutionEvent(currentClubOnField, {
      playerId: player._id,
      relatedPlayerId,
    });
  }

  return eventId;
}
