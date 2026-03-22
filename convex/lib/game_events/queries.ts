import type { QueryCtx } from "../../_generated/server";
import { buildPlayerFullName } from "@/lib/players/name";
import {
  buildCurrentOnFieldByClub,
  getGameEventAccessScope,
} from "./helpers";

export async function getGameEventsByGameIdHandler(
  ctx: QueryCtx,
  args: { gameId: any },
) {
  const { game, isOrgAdmin } = await getGameEventAccessScope(ctx, args.gameId);

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
      side: event.clubId === game.homeClubId ? ("home" as const) : ("away" as const),
      type: event.eventType,
      minute: event.minute,
      playerId: event.playerId,
      relatedPlayerId: event.relatedPlayerId,
      primaryText: event.playerName,
      secondaryText: event.relatedPlayerName,
    })),
  };
}

export async function getGameEventsEditorDataHandler(
  ctx: QueryCtx,
  args: { gameId: any },
) {
  const { game, isOrgAdmin } = await getGameEventAccessScope(ctx, args.gameId);
  if (!isOrgAdmin) {
    throw new Error("Admin access required for match events");
  }

  const allowedClubIds = [game.homeClubId, game.awayClubId];
  const clubs = await Promise.all(allowedClubIds.map((clubId) => ctx.db.get(clubId)));
  const clubNameMap = new Map(
    clubs
      .filter((club): club is NonNullable<typeof club> => Boolean(club))
      .map((club) => [club._id, club.name]),
  );

  const playersByClub = await Promise.all(
    allowedClubIds.map((clubId) =>
      ctx.db.query("players").withIndex("byClub", (q) => q.eq("clubId", clubId)).collect(),
    ),
  );

  const currentOnFieldByClub = await buildCurrentOnFieldByClub(
    ctx,
    args.gameId,
    allowedClubIds,
  );

  return {
    canManageEvents: true,
    players: playersByClub
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
      })),
    clubStates: allowedClubIds.map((clubId) => ({
      clubId,
      onFieldPlayerIds: Array.from(currentOnFieldByClub.get(clubId) ?? []),
    })),
  };
}
