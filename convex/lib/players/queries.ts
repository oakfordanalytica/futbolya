import type { QueryCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import { getCurrentUser } from "../../lib/auth";
import {
  requireClubAccess,
  requireClubAccessBySlug,
  requireOrgAdmin,
} from "../../lib/permissions";
import { buildPlayerFullName } from "@/lib/players/name";
import { didPlayerParticipate } from "@/lib/soccer/stats-domain";
import {
  buildCategoryMap,
  buildPlayerBase,
  getPlayerPhotoUrl,
  shouldIncludePlayerStatGame,
} from "./helpers";

export async function listSoccerPlayersByClubSlugHandler(
  ctx: QueryCtx,
  args: { clubSlug: string },
) {
  const existingClub = await ctx.db
    .query("clubs")
    .withIndex("bySlug", (q) => q.eq("slug", args.clubSlug))
    .unique();

  if (!existingClub) {
    return [];
  }

  const { club } = await requireClubAccess(ctx, existingClub._id);

  const players = await ctx.db
    .query("players")
    .withIndex("byClub", (q) => q.eq("clubId", club._id))
    .collect();
  const soccerPlayers = players.filter(
    (player) => player.sportType === "soccer",
  );
  const categoryMap = await buildCategoryMap(
    ctx,
    soccerPlayers.map((player) => player.categoryId),
  );

  return await Promise.all(
    soccerPlayers.map(async (player) => ({
      ...buildPlayerBase(
        player,
        await getPlayerPhotoUrl(ctx, player.photoStorageId),
      ),
      categoryLeagueCategoryId: categoryMap.get(player.categoryId)
        ?.leagueCategoryId,
      categoryName: categoryMap.get(player.categoryId)?.name,
      categoryAgeGroup: categoryMap.get(player.categoryId)?.ageGroup,
      clubSlug: club.slug,
      clubName: club.name,
      clubNickname: club.nickname,
    })),
  );
}

export async function listSoccerPlayersByLeagueSlugHandler(
  ctx: QueryCtx,
  args: { leagueSlug: string },
) {
  const { organization } = await requireOrgAdmin(ctx, args.leagueSlug);

  const clubs = await ctx.db
    .query("clubs")
    .withIndex("byOrganization", (q) =>
      q.eq("organizationId", organization._id),
    )
    .collect();

  if (clubs.length === 0) {
    return [];
  }

  const clubMap = new Map(clubs.map((club) => [club._id, club]));
  const playersByClub = await Promise.all(
    clubs.map((club) =>
      ctx.db
        .query("players")
        .withIndex("byClub", (q) => q.eq("clubId", club._id))
        .collect(),
    ),
  );

  const players = playersByClub
    .flat()
    .filter((player) => player.sportType === "soccer")
    .sort((a, b) =>
      `${a.lastName} ${a.firstName}`.localeCompare(
        `${b.lastName} ${b.firstName}`,
      ),
    );

  const categoryMap = await buildCategoryMap(
    ctx,
    players.map((player) => player.categoryId),
  );

  return await Promise.all(
    players.map(async (player) => {
      const club = clubMap.get(player.clubId)!;

      return {
        ...buildPlayerBase(
          player,
          await getPlayerPhotoUrl(ctx, player.photoStorageId),
        ),
        categoryLeagueCategoryId: categoryMap.get(player.categoryId)
          ?.leagueCategoryId,
        categoryName: categoryMap.get(player.categoryId)?.name,
        categoryAgeGroup: categoryMap.get(player.categoryId)?.ageGroup,
        clubSlug: club.slug,
        clubName: club.name,
        clubNickname: club.nickname,
      };
    }),
  );
}

export async function getSoccerPlayerDetailByClubSlugHandler(
  ctx: QueryCtx,
  args: {
    clubSlug: string;
    playerId: Id<"players">;
  },
) {
  const { club, accessLevel } = await requireClubAccessBySlug(
    ctx,
    args.clubSlug,
  );

  const player = await ctx.db.get(args.playerId);
  if (!player || player.clubId !== club._id || player.sportType !== "soccer") {
    return null;
  }

  const category = await ctx.db.get(player.categoryId);
  const playerStats = await ctx.db
    .query("gamePlayerStats")
    .withIndex("byPlayer", (q) => q.eq("playerId", player._id))
    .collect();

  const linkedGames = await Promise.all(
    playerStats.map((stat) => ctx.db.get(stat.gameId)),
  );

  let gamesPlayed = 0;
  let goals = 0;
  let yellowCards = 0;
  let redCards = 0;
  let penaltiesScored = 0;

  for (let index = 0; index < playerStats.length; index += 1) {
    const stat = playerStats[index];
    const game = linkedGames[index];

    if (!game || game.organizationId !== club.organizationId) {
      continue;
    }
    if (!shouldIncludePlayerStatGame(game)) {
      continue;
    }
    if (!didPlayerParticipate(stat)) {
      continue;
    }

    gamesPlayed += 1;
    goals += stat.goals ?? 0;
    yellowCards += stat.yellowCards ?? 0;
    redCards += stat.redCards ?? 0;
    penaltiesScored += stat.penaltiesScored ?? 0;
  }

  const [photoUrl, clubLogoUrl] = await Promise.all([
    getPlayerPhotoUrl(ctx, player.photoStorageId),
    club.logoStorageId
      ? ctx.storage.getUrl(club.logoStorageId)
      : Promise.resolve(null),
  ]);

  return {
    ...buildPlayerBase(player, photoUrl),
    categoryLeagueCategoryId: category?.leagueCategoryId,
    categoryName: category?.name,
    categoryAgeGroup: category?.ageGroup,
    clubId: club._id,
    clubName: club.name,
    clubSlug: club.slug,
    clubLogoUrl: clubLogoUrl ?? undefined,
    clubPrimaryColor: club.colors?.[0],
    highlights: player.highlights ?? [],
    gamesPlayed,
    goals,
    yellowCards,
    redCards,
    penaltiesScored,
    viewerAccessLevel: accessLevel,
  };
}

export async function listSoccerPlayerGameLogHandler(
  ctx: QueryCtx,
  args: {
    playerId: Id<"players">;
    limit?: number;
  },
) {
  await getCurrentUser(ctx);

  const player = await ctx.db.get(args.playerId);
  if (!player || player.sportType !== "soccer") {
    return [];
  }

  const { organization } = await requireClubAccess(ctx, player.clubId);

  const requestedLimit = Math.floor(args.limit ?? 50);
  const boundedLimit = Math.max(
    1,
    Math.min(Number.isFinite(requestedLimit) ? requestedLimit : 50, 200),
  );

  const stats = await ctx.db
    .query("gamePlayerStats")
    .withIndex("byPlayer", (q) => q.eq("playerId", player._id))
    .collect();

  if (stats.length === 0) {
    return [];
  }

  const linkedGames = await Promise.all(
    stats.map((stat) => ctx.db.get(stat.gameId)),
  );

  const rowsWithOpponentId: Array<{
    gameId: Id<"games">;
    date: string;
    startTime: string;
    gameType: "quick" | "season";
    teamId: Id<"clubs">;
    opponentId: Id<"clubs">;
    result: "W" | "L" | "—";
    teamScore?: number;
    opponentScore?: number;
    goals: number;
    yellowCards: number;
    redCards: number;
    penaltiesScored: number;
    sortKey: number;
  }> = [];
  const relatedClubIds = new Set<Id<"clubs">>();

  for (let index = 0; index < stats.length; index += 1) {
    const stat = stats[index];
    const game = linkedGames[index];
    if (!game || game.organizationId !== organization._id) {
      continue;
    }
    if (!shouldIncludePlayerStatGame(game)) {
      continue;
    }
    if (!didPlayerParticipate(stat)) {
      continue;
    }

    const playedAsHome = stat.clubId === game.homeClubId;
    const playedAsAway = stat.clubId === game.awayClubId;
    if (!playedAsHome && !playedAsAway) {
      continue;
    }

    const opponentId = playedAsHome ? game.awayClubId : game.homeClubId;
    relatedClubIds.add(stat.clubId);
    relatedClubIds.add(opponentId);

    const teamScore = playedAsHome ? game.homeScore : game.awayScore;
    const opponentScore = playedAsHome ? game.awayScore : game.homeScore;

    let result: "W" | "L" | "—" = "—";
    if (typeof teamScore === "number" && typeof opponentScore === "number") {
      if (teamScore > opponentScore) {
        result = "W";
      } else if (teamScore < opponentScore) {
        result = "L";
      }
    }

    const [year, month, day] = game.date.split("-").map(Number);
    const [hours = 0, minutes = 0] = game.startTime.split(":").map(Number);
    const sortKey = Date.UTC(year, (month || 1) - 1, day || 1, hours, minutes);

    rowsWithOpponentId.push({
      gameId: game._id,
      date: game.date,
      startTime: game.startTime,
      gameType: game.seasonId ? "season" : "quick",
      teamId: stat.clubId,
      opponentId,
      result,
      teamScore,
      opponentScore,
      goals: stat.goals ?? 0,
      yellowCards: stat.yellowCards ?? 0,
      redCards: stat.redCards ?? 0,
      penaltiesScored: stat.penaltiesScored ?? 0,
      sortKey,
    });
  }

  if (rowsWithOpponentId.length === 0) {
    return [];
  }

  const relatedClubs = await Promise.all(
    [...relatedClubIds].map((clubId) => ctx.db.get(clubId)),
  );
  const clubMap = new Map(
    relatedClubs.filter(Boolean).map((club) => [club!._id, club!]),
  );

  return rowsWithOpponentId
    .sort((a, b) => b.sortKey - a.sortKey)
    .slice(0, boundedLimit)
    .map(({ teamId, opponentId, sortKey: _sortKey, ...row }) => ({
      ...row,
      teamName: clubMap.get(teamId)?.name ?? "Unknown",
      teamNickname: clubMap.get(teamId)?.nickname,
      opponentName: clubMap.get(opponentId)?.name ?? "Unknown",
      opponentNickname: clubMap.get(opponentId)?.nickname,
    }));
}
