import { v } from "convex/values";
import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { getCurrentUser } from "./lib/auth";
import { hasClubStaffAccess, hasOrgAdminAccess } from "./lib/permissions";
import { buildPlayerFullName } from "@/lib/players/name";

const gameEventType = v.union(
  v.literal("goal"),
  v.literal("yellow_card"),
  v.literal("red_card"),
  v.literal("substitution"),
  v.literal("penalty_scored"),
  v.literal("penalty_missed"),
);

const timelineEventValidator = v.object({
  id: v.id("gameEvents"),
  side: v.union(v.literal("home"), v.literal("away")),
  type: gameEventType,
  minute: v.number(),
  playerId: v.id("players"),
  relatedPlayerId: v.optional(v.id("players")),
  primaryText: v.string(),
  secondaryText: v.optional(v.string()),
});

const editorPlayerValidator = v.object({
  _id: v.id("players"),
  clubId: v.id("clubs"),
  teamName: v.string(),
  playerName: v.string(),
  jerseyNumber: v.optional(v.number()),
  cometNumber: v.optional(v.string()),
});

const editorClubStateValidator = v.object({
  clubId: v.id("clubs"),
  onFieldPlayerIds: v.array(v.id("players")),
});

const registerEventInputValidator = v.object({
  playerId: v.id("players"),
  relatedPlayerId: v.optional(v.id("players")),
  eventType: gameEventType,
});

type EventCtx = QueryCtx | MutationCtx;
type PlayerStatIncrements = {
  goals?: number;
  yellowCards?: number;
  redCards?: number;
  penaltiesAttempted?: number;
  penaltiesScored?: number;
  substitutionsIn?: number;
  substitutionsOut?: number;
};
type TeamStatIncrements = {
  substitutions?: number;
};

async function getGameEventAccessScope(ctx: EventCtx, gameId: Id<"games">) {
  const user = await getCurrentUser(ctx);
  const game = await ctx.db.get(gameId);
  if (!game) {
    throw new Error("Game not found");
  }

  const isOrgAdmin = await hasOrgAdminAccess(
    ctx,
    user._id,
    game.organizationId,
  );
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

function buildPlayerStatIncrementPatch(
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

function buildTeamStatIncrementPatch(
  current: {
    substitutions?: number;
  },
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
    .withIndex("byGameAndClub", (q) =>
      q.eq("gameId", gameId).eq("clubId", clubId),
    )
    .unique();

  return Boolean(lineup?.starterPlayerIds.some((id) => id === playerId));
}

async function incrementPlayerStatsRow(
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
    .withIndex("byGameAndClub", (q) =>
      q.eq("gameId", args.gameId).eq("clubId", args.clubId),
    )
    .collect();

  const existing = existingStats.find(
    (stat) => stat.playerId === args.playerId,
  );
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

async function incrementTeamStatsRow(
  ctx: MutationCtx,
  args: {
    gameId: Id<"games">;
    clubId: Id<"clubs">;
    increments: TeamStatIncrements;
  },
) {
  const existing = await ctx.db
    .query("gameTeamStats")
    .withIndex("byGameAndClub", (q) =>
      q.eq("gameId", args.gameId).eq("clubId", args.clubId),
    )
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

async function incrementGameScore(
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
    .withIndex("byGameAndClub", (q) =>
      q.eq("gameId", gameId).eq("clubId", clubId),
    )
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
    .withIndex("byGameAndClub", (q) =>
      q.eq("gameId", gameId).eq("clubId", clubId),
    )
    .collect();

  const starterStatIds = statRows
    .filter((stat) => stat.isStarter)
    .map((stat) => stat.playerId);

  if (starterStatIds.length > 0) {
    return starterStatIds;
  }

  return [];
}

async function buildCurrentOnFieldByClub(
  ctx: EventCtx,
  gameId: Id<"games">,
  clubIds: Id<"clubs">[],
) {
  const clubEntries: Array<[Id<"clubs">, Set<Id<"players">>]> =
    await Promise.all(
      clubIds.map(
        async (clubId) =>
          [
            clubId,
            new Set(
              await getInitialOnFieldPlayerIdsForClub(ctx, gameId, clubId),
            ),
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

function resolveSubstitutionDirection(
  currentOnField: Set<Id<"players">>,
  event: {
    playerId: Id<"players">;
    relatedPlayerId?: Id<"players">;
  },
) {
  if (!event.relatedPlayerId) {
    return null;
  }

  const playerIsOnField = currentOnField.has(event.playerId);
  const relatedPlayerIsOnField = currentOnField.has(event.relatedPlayerId);

  if (playerIsOnField && !relatedPlayerIsOnField) {
    return {
      outgoingPlayerId: event.playerId,
      incomingPlayerId: event.relatedPlayerId,
    };
  }

  if (!playerIsOnField && relatedPlayerIsOnField) {
    return {
      outgoingPlayerId: event.relatedPlayerId,
      incomingPlayerId: event.playerId,
    };
  }

  return {
    outgoingPlayerId: event.playerId,
    incomingPlayerId: event.relatedPlayerId,
  };
}

async function registerEventAndSync(
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
  if (
    (isHomePlayer && !args.canManageHome) ||
    (isAwayPlayer && !args.canManageAway)
  ) {
    throw new Error(
      "You do not have permission to register events for this team",
    );
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
    if (
      relatedPlayer.status !== "active" ||
      relatedPlayer.sportType !== "soccer"
    ) {
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

  switch (args.eventType) {
    case "goal":
      await incrementPlayerStatsRow(ctx, {
        gameId: args.gameId,
        clubId: player.clubId,
        playerId: player._id,
        increments: { goals: 1 },
      });
      await incrementGameScore(ctx, {
        game: args.game,
        scoringClubId: player.clubId,
      });
      break;
    case "yellow_card":
      await incrementPlayerStatsRow(ctx, {
        gameId: args.gameId,
        clubId: player.clubId,
        playerId: player._id,
        increments: { yellowCards: 1 },
      });
      break;
    case "red_card":
      await incrementPlayerStatsRow(ctx, {
        gameId: args.gameId,
        clubId: player.clubId,
        playerId: player._id,
        increments: { redCards: 1 },
      });
      break;
    case "penalty_scored":
      await incrementPlayerStatsRow(ctx, {
        gameId: args.gameId,
        clubId: player.clubId,
        playerId: player._id,
        increments: {
          goals: 1,
          penaltiesAttempted: 1,
          penaltiesScored: 1,
        },
      });
      await incrementGameScore(ctx, {
        game: args.game,
        scoringClubId: player.clubId,
      });
      break;
    case "penalty_missed":
      await incrementPlayerStatsRow(ctx, {
        gameId: args.gameId,
        clubId: player.clubId,
        playerId: player._id,
        increments: { penaltiesAttempted: 1 },
      });
      break;
    case "substitution":
      await incrementPlayerStatsRow(ctx, {
        gameId: args.gameId,
        clubId: player.clubId,
        playerId: player._id,
        increments: { substitutionsOut: 1 },
      });
      if (relatedPlayerId) {
        await incrementPlayerStatsRow(ctx, {
          gameId: args.gameId,
          clubId: player.clubId,
          playerId: relatedPlayerId,
          increments: { substitutionsIn: 1 },
        });
      }
      await incrementTeamStatsRow(ctx, {
        gameId: args.gameId,
        clubId: player.clubId,
        increments: { substitutions: 1 },
      });
      if (relatedPlayerId) {
        currentClubOnField.delete(player._id);
        currentClubOnField.add(relatedPlayerId);
      }
      break;
    default:
      break;
  }

  return eventId;
}

export const getByGameId = query({
  args: { gameId: v.id("games") },
  returns: v.object({
    canManageEvents: v.boolean(),
    events: v.array(timelineEventValidator),
  }),
  handler: async (ctx, args) => {
    const { game, isOrgAdmin } = await getGameEventAccessScope(
      ctx,
      args.gameId,
    );

    const events = await ctx.db
      .query("gameEvents")
      .withIndex("byGame", (q) => q.eq("gameId", args.gameId))
      .collect();

    const sortedEvents = events.sort((a, b) => {
      if (a.minute !== b.minute) {
        return a.minute - b.minute;
      }
      return a._creationTime - b._creationTime;
    });

    return {
      canManageEvents: isOrgAdmin,
      events: sortedEvents.map((event) => ({
        id: event._id,
        side:
          event.clubId === game.homeClubId
            ? ("home" as const)
            : ("away" as const),
        type: event.eventType,
        minute: event.minute,
        playerId: event.playerId,
        relatedPlayerId: event.relatedPlayerId,
        primaryText: event.playerName,
        secondaryText: event.relatedPlayerName,
      })),
    };
  },
});

export const getEditorData = query({
  args: { gameId: v.id("games") },
  returns: v.object({
    canManageEvents: v.boolean(),
    players: v.array(editorPlayerValidator),
    clubStates: v.array(editorClubStateValidator),
  }),
  handler: async (ctx, args) => {
    const { game, isOrgAdmin } = await getGameEventAccessScope(
      ctx,
      args.gameId,
    );
    if (!isOrgAdmin) {
      throw new Error("Admin access required for match events");
    }

    const allowedClubIds = [game.homeClubId, game.awayClubId];

    const clubs = await Promise.all(
      allowedClubIds.map((clubId) => ctx.db.get(clubId)),
    );
    const clubNameMap = new Map(
      clubs
        .filter((club): club is NonNullable<typeof club> => Boolean(club))
        .map((club) => [club._id, club.name]),
    );

    const playersByClub = await Promise.all(
      allowedClubIds.map((clubId) =>
        ctx.db
          .query("players")
          .withIndex("byClub", (q) => q.eq("clubId", clubId))
          .collect(),
      ),
    );

    const currentOnFieldByClub = await buildCurrentOnFieldByClub(
      ctx,
      args.gameId,
      allowedClubIds,
    );

    const players = playersByClub
      .flat()
      .filter(
        (player) => player.sportType === "soccer" && player.status === "active",
      )
      .sort((a, b) =>
        buildPlayerFullName(
          a.firstName,
          a.lastName,
          a.secondLastName,
        ).localeCompare(
          buildPlayerFullName(b.firstName, b.lastName, b.secondLastName),
          undefined,
          { sensitivity: "base" },
        ),
      )
      .map((player) => ({
        _id: player._id,
        clubId: player.clubId,
        teamName: clubNameMap.get(player.clubId) ?? "Equipo",
        playerName: buildPlayerFullName(
          player.firstName,
          player.lastName,
          player.secondLastName,
        ),
        jerseyNumber: player.jerseyNumber,
        cometNumber: player.cometNumber,
      }));

    return {
      canManageEvents: true,
      players,
      clubStates: allowedClubIds.map((clubId) => ({
        clubId,
        onFieldPlayerIds: Array.from(currentOnFieldByClub.get(clubId) ?? []),
      })),
    };
  },
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
  handler: async (ctx, args) => {
    const { user, game, isOrgAdmin } = await getGameEventAccessScope(
      ctx,
      args.gameId,
    );
    if (!isOrgAdmin) {
      throw new Error("Admin access required for match events");
    }
    const currentOnFieldByClub = await buildCurrentOnFieldByClub(
      ctx,
      args.gameId,
      [game.homeClubId, game.awayClubId],
    );

    if (!Number.isFinite(args.minute) || args.minute < 1 || args.minute > 130) {
      throw new Error("Minute must be between 1 and 130");
    }
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
  },
});

export const registerBatch = mutation({
  args: {
    gameId: v.id("games"),
    minute: v.number(),
    events: v.array(registerEventInputValidator),
  },
  returns: v.array(v.id("gameEvents")),
  handler: async (ctx, args) => {
    const { user, game, isOrgAdmin } = await getGameEventAccessScope(
      ctx,
      args.gameId,
    );
    if (!isOrgAdmin) {
      throw new Error("Admin access required for match events");
    }
    const currentOnFieldByClub = await buildCurrentOnFieldByClub(
      ctx,
      args.gameId,
      [game.homeClubId, game.awayClubId],
    );

    if (!Number.isFinite(args.minute) || args.minute < 1 || args.minute > 130) {
      throw new Error("Minute must be between 1 and 130");
    }
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
  },
});
