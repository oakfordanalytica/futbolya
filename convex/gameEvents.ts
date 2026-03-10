import { v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { getCurrentUser } from "./lib/auth";
import { hasClubStaffAccess, hasOrgAdminAccess } from "./lib/permissions";
import { buildPlayerFullName } from "@/lib/players/name";

const gameEventType = v.union(
  v.literal("goal"),
  v.literal("yellow_card"),
  v.literal("red_card"),
  v.literal("penalty_scored"),
  v.literal("penalty_missed"),
);

const timelineEventValidator = v.object({
  id: v.id("gameEvents"),
  side: v.union(v.literal("home"), v.literal("away")),
  type: gameEventType,
  minute: v.number(),
  primaryText: v.string(),
});

const editorPlayerValidator = v.object({
  _id: v.id("players"),
  clubId: v.id("clubs"),
  teamName: v.string(),
  playerName: v.string(),
  jerseyNumber: v.optional(v.number()),
  cometNumber: v.optional(v.string()),
});

type EventCtx = QueryCtx | MutationCtx;

async function getGameEventAccessScope(ctx: EventCtx, gameId: Id<"games">) {
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
    canManageHome: isOrgAdmin || canManageHome,
    canManageAway: isOrgAdmin || canManageAway,
  };
}

export const getByGameId = query({
  args: { gameId: v.id("games") },
  returns: v.object({
    canManageEvents: v.boolean(),
    events: v.array(timelineEventValidator),
  }),
  handler: async (ctx, args) => {
    const { game, canManageHome, canManageAway } = await getGameEventAccessScope(
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
      canManageEvents: canManageHome || canManageAway,
      events: sortedEvents.map((event) => ({
        id: event._id,
        side: event.clubId === game.homeClubId ? ("home" as const) : ("away" as const),
        type: event.eventType,
        minute: event.minute,
        primaryText: event.playerName,
      })),
    };
  },
});

export const getEditorData = query({
  args: { gameId: v.id("games") },
  returns: v.object({
    canManageEvents: v.boolean(),
    players: v.array(editorPlayerValidator),
  }),
  handler: async (ctx, args) => {
    const { game, canManageHome, canManageAway } = await getGameEventAccessScope(
      ctx,
      args.gameId,
    );

    const allowedClubIds = [
      ...(canManageHome ? [game.homeClubId] : []),
      ...(canManageAway ? [game.awayClubId] : []),
    ];

    const clubs = await Promise.all(allowedClubIds.map((clubId) => ctx.db.get(clubId)));
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

    const players = playersByClub
      .flat()
      .filter((player) => player.sportType === "soccer" && player.status === "active")
      .sort((a, b) =>
        buildPlayerFullName(a.firstName, a.lastName, a.secondLastName).localeCompare(
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
      canManageEvents: canManageHome || canManageAway,
      players,
    };
  },
});

export const register = mutation({
  args: {
    gameId: v.id("games"),
    playerId: v.id("players"),
    minute: v.number(),
    eventType: gameEventType,
  },
  returns: v.id("gameEvents"),
  handler: async (ctx, args) => {
    const { user, game, canManageHome, canManageAway } = await getGameEventAccessScope(
      ctx,
      args.gameId,
    );

    if (!Number.isFinite(args.minute) || args.minute < 1 || args.minute > 130) {
      throw new Error("Minute must be between 1 and 130");
    }

    const player = await ctx.db.get(args.playerId);
    if (!player) {
      throw new Error("Player not found");
    }
    if (player.status !== "active" || player.sportType !== "soccer") {
      throw new Error("Player is not eligible for match events");
    }

    const isHomePlayer = player.clubId === game.homeClubId;
    const isAwayPlayer = player.clubId === game.awayClubId;
    if (!isHomePlayer && !isAwayPlayer) {
      throw new Error("Player does not belong to a team in this game");
    }
    if ((isHomePlayer && !canManageHome) || (isAwayPlayer && !canManageAway)) {
      throw new Error("You do not have permission to register events for this team");
    }

    const playerName = buildPlayerFullName(
      player.firstName,
      player.lastName,
      player.secondLastName,
    );

    return await ctx.db.insert("gameEvents", {
      gameId: args.gameId,
      organizationId: game.organizationId,
      clubId: player.clubId,
      playerId: player._id,
      playerName,
      minute: Math.trunc(args.minute),
      eventType: args.eventType,
      createdByUserId: user._id,
    });
  },
});
