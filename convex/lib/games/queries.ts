import type { QueryCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import { getCurrentUser } from "../../lib/auth";
import {
  hasOrgAdminAccess,
  requireClubAccessBySlug,
  requireOrgAccess,
} from "../../lib/permissions";
import { buildPlayerFullName } from "@/lib/players/name";
import {
  buildSubstitutionCountsFromEvents,
  didPlayerParticipate,
} from "@/lib/soccer/stats-domain";
import { normalizeGameStatus } from "@/lib/games/status";
import { buildSeasonStatsAggregate } from "./season_stats";
import {
  buildTeamTotals,
  loadClubsWithLogos,
  requireGameAccess,
  topByMetric,
} from "./utils";
import type {
  SeasonPlayerLeader,
  SeasonPlayerLeaders,
  SeasonTeamLeader,
  SeasonTeamLeaders,
} from "./validators";

export async function listByLeagueSlugHandler(
  ctx: QueryCtx,
  args: { orgSlug: string },
) {
  const org = await ctx.db
    .query("organizations")
    .withIndex("bySlug", (q) => q.eq("slug", args.orgSlug))
    .unique();

  if (!org) {
    return [];
  }

  const user = await getCurrentUser(ctx);
  const isOrgAdmin = await hasOrgAdminAccess(ctx, user._id, org._id);
  if (!isOrgAdmin) {
    throw new Error("Admin access required");
  }

  const games = await ctx.db
    .query("games")
    .withIndex("byOrganization", (q) => q.eq("organizationId", org._id))
    .order("desc")
    .collect();

  const { clubMap, clubLogoMap } = await loadClubsWithLogos(
    ctx,
    games.flatMap((game) => [game.homeClubId, game.awayClubId]),
  );

  return games.map((game) => {
    const homeClub = clubMap.get(game.homeClubId);
    const awayClub = clubMap.get(game.awayClubId);

    return {
      _id: game._id,
      _creationTime: game._creationTime,
      seasonId: game.seasonId,
      gameType: game.seasonId ? ("season" as const) : ("quick" as const),
      homeTeamId: game.homeClubId,
      homeTeamName: homeClub?.name ?? "Unknown",
      homeTeamLogo: clubLogoMap.get(game.homeClubId),
      awayTeamId: game.awayClubId,
      awayTeamName: awayClub?.name ?? "Unknown",
      awayTeamLogo: clubLogoMap.get(game.awayClubId),
      date: game.date,
      startTime: game.startTime,
      category: game.category,
      gender: game.gender,
      locationName: game.locationName,
      locationCoordinates: game.locationCoordinates,
      status: normalizeGameStatus(game.status),
      homeScore: game.homeScore,
      awayScore: game.awayScore,
      matchStartedAt: game.matchStartedAt,
      matchEndedAt: game.matchEndedAt,
      matchPhase: game.matchPhase,
      firstHalfStartedAt: game.firstHalfStartedAt,
      firstHalfEndedAt: game.firstHalfEndedAt,
      secondHalfStartedAt: game.secondHalfStartedAt,
      secondHalfEndedAt: game.secondHalfEndedAt,
      firstHalfAddedMinutes: game.firstHalfAddedMinutes,
      secondHalfAddedMinutes: game.secondHalfAddedMinutes,
    };
  });
}

export async function listByClubSlugHandler(
  ctx: QueryCtx,
  args: { clubSlug: string },
) {
  const { club } = await requireClubAccessBySlug(ctx, args.clubSlug);

  const [homeGames, awayGames] = await Promise.all([
    ctx.db
      .query("games")
      .withIndex("byHomeClub", (q) => q.eq("homeClubId", club._id))
      .collect(),
    ctx.db
      .query("games")
      .withIndex("byAwayClub", (q) => q.eq("awayClubId", club._id))
      .collect(),
  ]);

  const uniqueGames = Array.from(
    new Map(
      [...homeGames, ...awayGames].map((game) => [game._id, game]),
    ).values(),
  ).sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.startTime}`).getTime();
    const dateB = new Date(`${b.date}T${b.startTime}`).getTime();
    return dateB - dateA;
  });

  const { clubMap, clubLogoMap } = await loadClubsWithLogos(
    ctx,
    uniqueGames.flatMap((game) => [game.homeClubId, game.awayClubId]),
  );

  return uniqueGames.map((game) => {
    const homeClub = clubMap.get(game.homeClubId);
    const awayClub = clubMap.get(game.awayClubId);

    return {
      _id: game._id,
      _creationTime: game._creationTime,
      seasonId: game.seasonId,
      gameType: game.seasonId ? ("season" as const) : ("quick" as const),
      homeTeamId: game.homeClubId,
      homeTeamName: homeClub?.name ?? "Unknown",
      homeTeamLogo: clubLogoMap.get(game.homeClubId),
      awayTeamId: game.awayClubId,
      awayTeamName: awayClub?.name ?? "Unknown",
      awayTeamLogo: clubLogoMap.get(game.awayClubId),
      date: game.date,
      startTime: game.startTime,
      category: game.category,
      gender: game.gender,
      locationName: game.locationName,
      locationCoordinates: game.locationCoordinates,
      status: normalizeGameStatus(game.status),
      homeScore: game.homeScore,
      awayScore: game.awayScore,
      matchStartedAt: game.matchStartedAt,
      matchEndedAt: game.matchEndedAt,
      matchPhase: game.matchPhase,
      firstHalfStartedAt: game.firstHalfStartedAt,
      firstHalfEndedAt: game.firstHalfEndedAt,
      secondHalfStartedAt: game.secondHalfStartedAt,
      secondHalfEndedAt: game.secondHalfEndedAt,
      firstHalfAddedMinutes: game.firstHalfAddedMinutes,
      secondHalfAddedMinutes: game.secondHalfAddedMinutes,
    };
  });
}

export async function getGamePlayerStatsHandler(
  ctx: QueryCtx,
  args: { gameId: Id<"games"> },
) {
  const game = await ctx.db.get(args.gameId);
  if (!game) {
    return {
      homeStats: [],
      awayStats: [],
      homeTeamStats: {
        clubId: "" as Id<"clubs">,
        goals: 0,
        corners: 0,
        freeKicks: 0,
        yellowCards: 0,
        redCards: 0,
        penaltiesAttempted: 0,
        penaltiesScored: 0,
        substitutions: 0,
      },
      awayTeamStats: {
        clubId: "" as Id<"clubs">,
        goals: 0,
        corners: 0,
        freeKicks: 0,
        yellowCards: 0,
        redCards: 0,
        penaltiesAttempted: 0,
        penaltiesScored: 0,
        substitutions: 0,
      },
    };
  }

  await requireGameAccess(ctx, game);

  const [allPlayerStats, teamStatsRows, gameEvents] = await Promise.all([
    ctx.db
      .query("gamePlayerStats")
      .withIndex("byGame", (q) => q.eq("gameId", args.gameId))
      .collect(),
    ctx.db
      .query("gameTeamStats")
      .withIndex("byGame", (q) => q.eq("gameId", args.gameId))
      .collect(),
    ctx.db
      .query("gameEvents")
      .withIndex("byGame", (q) => q.eq("gameId", args.gameId))
      .collect(),
  ]);

  const initialOnFieldByClub = new Map<Id<"clubs">, Set<Id<"players">>>([
    [
      game.homeClubId,
      new Set(
        allPlayerStats
          .filter((stat) => stat.clubId === game.homeClubId && stat.isStarter)
          .map((stat) => stat.playerId),
      ),
    ],
    [
      game.awayClubId,
      new Set(
        allPlayerStats
          .filter((stat) => stat.clubId === game.awayClubId && stat.isStarter)
          .map((stat) => stat.playerId),
      ),
    ],
  ]);

  const substitutionCounts = buildSubstitutionCountsFromEvents({
    events: gameEvents,
    initialOnFieldByClub,
  });

  const playerIds = [...new Set(allPlayerStats.map((stat) => stat.playerId))];
  const players = await Promise.all(playerIds.map((id) => ctx.db.get(id)));
  const playerMap = new Map(
    players.filter(Boolean).map((player) => [player!._id, player!]),
  );

  const photoUrls = new Map<Id<"players">, string>();
  await Promise.all(
    players.map(async (player) => {
      if (!player?.photoStorageId) {
        return;
      }
      const url = await ctx.storage.getUrl(player.photoStorageId);
      if (url) {
        photoUrls.set(player._id, url);
      }
    }),
  );

  const mapStats = (stats: typeof allPlayerStats) =>
    stats.filter(didPlayerParticipate).map((stat) => {
      const player = playerMap.get(stat.playerId);
      const substitutions = substitutionCounts.get(stat.playerId);
      return {
        _id: stat._id,
        playerId: stat.playerId,
        playerName: player
          ? buildPlayerFullName(
              player.firstName,
              player.lastName,
              player.secondLastName,
            )
          : "Unknown",
        jerseyNumber: player?.jerseyNumber,
        cometNumber: player?.cometNumber,
        photoUrl: photoUrls.get(stat.playerId),
        clubId: stat.clubId,
        isStarter: stat.isStarter,
        goals: stat.goals,
        yellowCards: stat.yellowCards,
        redCards: stat.redCards,
        penaltiesAttempted: stat.penaltiesAttempted,
        penaltiesScored: stat.penaltiesScored,
        substitutionsIn: substitutions?.substitutionsIn ?? stat.substitutionsIn,
        substitutionsOut:
          substitutions?.substitutionsOut ?? stat.substitutionsOut,
      };
    });

  const homeStats = mapStats(
    allPlayerStats.filter((stat) => stat.clubId === game.homeClubId),
  );
  const awayStats = mapStats(
    allPlayerStats.filter((stat) => stat.clubId === game.awayClubId),
  );

  const teamStatsByClub = new Map(
    teamStatsRows.map((row) => [row.clubId, row]),
  );

  return {
    homeStats,
    awayStats,
    homeTeamStats: buildTeamTotals(
      game.homeClubId,
      game,
      allPlayerStats,
      teamStatsByClub.get(game.homeClubId) ?? null,
    ),
    awayTeamStats: buildTeamTotals(
      game.awayClubId,
      game,
      allPlayerStats,
      teamStatsByClub.get(game.awayClubId) ?? null,
    ),
  };
}

export async function getSeasonLeadersHandler(
  ctx: QueryCtx,
  args: { orgSlug: string; seasonId: string; limit?: number },
) {
  const { organization } = await requireOrgAccess(ctx, args.orgSlug);
  const rawLimit = Math.floor(args.limit ?? 10);
  const leaderLimit = Math.max(1, Math.min(20, rawLimit));

  const seasonStats = await buildSeasonStatsAggregate(
    ctx,
    organization._id,
    args.seasonId,
  );

  const emptyPlayerLeaders: SeasonPlayerLeaders = {
    goals: [],
    goalsPerGame: [],
    yellowCards: [],
    redCards: [],
    penaltiesScored: [],
  };
  const emptyTeamLeaders: SeasonTeamLeaders = {
    points: [],
    goalsFor: [],
    goalsAgainst: [],
    goalDifference: [],
    cleanSheets: [],
  };

  if (seasonStats.gamesCount === 0) {
    return {
      season: seasonStats.season,
      gamesCount: 0,
      leaderLimit,
      playerLeaders: emptyPlayerLeaders,
      teamLeaders: emptyTeamLeaders,
    };
  }

  const playerLeaderRows: Array<SeasonPlayerLeader> =
    seasonStats.playerRows.map((row) => ({
      playerId: row.playerId,
      playerName: row.playerName,
      photoUrl: row.photoUrl,
      clubId: row.clubId,
      clubName: row.clubName,
      gamesPlayed: row.gamesPlayed,
      goals: row.goals,
      goalsPerGame: row.goalsPerGame,
      yellowCards: row.yellowCards,
      redCards: row.redCards,
      penaltiesScored: row.penaltiesScored,
    }));
  const teamLeaderRows: Array<SeasonTeamLeader> = seasonStats.teamRows.map(
    (row) => ({
      clubId: row.clubId,
      clubName: row.clubName,
      gamesPlayed: row.gamesPlayed,
      wins: row.wins,
      draws: row.draws,
      losses: row.losses,
      points: row.points,
      goalsFor: row.goalsFor,
      goalsAgainst: row.goalsAgainst,
      goalDifference: row.goalDifference,
      cleanSheets: row.cleanSheets,
    }),
  );

  return {
    season: seasonStats.season,
    gamesCount: seasonStats.gamesCount,
    leaderLimit,
    playerLeaders: {
      goals: topByMetric(playerLeaderRows, (item) => item.goals, leaderLimit),
      goalsPerGame: topByMetric(
        playerLeaderRows,
        (item) => item.goalsPerGame,
        leaderLimit,
      ),
      yellowCards: topByMetric(
        playerLeaderRows,
        (item) => item.yellowCards,
        leaderLimit,
      ),
      redCards: topByMetric(
        playerLeaderRows,
        (item) => item.redCards,
        leaderLimit,
      ),
      penaltiesScored: topByMetric(
        playerLeaderRows,
        (item) => item.penaltiesScored,
        leaderLimit,
      ),
    },
    teamLeaders: {
      points: topByMetric(teamLeaderRows, (item) => item.points, leaderLimit),
      goalsFor: topByMetric(
        teamLeaderRows,
        (item) => item.goalsFor,
        leaderLimit,
      ),
      goalsAgainst: topByMetric(
        teamLeaderRows,
        (item) => item.goalsAgainst,
        leaderLimit,
        "asc",
      ),
      goalDifference: topByMetric(
        teamLeaderRows,
        (item) => item.goalDifference,
        leaderLimit,
      ),
      cleanSheets: topByMetric(
        teamLeaderRows,
        (item) => item.cleanSheets,
        leaderLimit,
      ),
    },
  };
}

export async function getSeasonStatsTableHandler(
  ctx: QueryCtx,
  args: { orgSlug: string; seasonId: string },
) {
  const { organization } = await requireOrgAccess(ctx, args.orgSlug);
  const seasonStats = await buildSeasonStatsAggregate(
    ctx,
    organization._id,
    args.seasonId,
  );

  return {
    season: seasonStats.season,
    gamesCount: seasonStats.gamesCount,
    players: seasonStats.playerRows,
    teams: seasonStats.teamRows,
  };
}

export async function getByIdHandler(
  ctx: QueryCtx,
  args: { gameId: Id<"games"> },
) {
  const game = await ctx.db.get(args.gameId);
  if (!game) {
    return null;
  }

  await requireGameAccess(ctx, game);

  const [homeClub, awayClub] = await Promise.all([
    ctx.db.get(game.homeClubId),
    ctx.db.get(game.awayClubId),
  ]);

  const homeTeamLogo = homeClub?.logoStorageId
    ? ((await ctx.storage.getUrl(homeClub.logoStorageId)) ?? undefined)
    : undefined;
  const awayTeamLogo = awayClub?.logoStorageId
    ? ((await ctx.storage.getUrl(awayClub.logoStorageId)) ?? undefined)
    : undefined;

  return {
    _id: game._id,
    _creationTime: game._creationTime,
    organizationId: game.organizationId,
    seasonId: game.seasonId,
    homeClubId: game.homeClubId,
    awayClubId: game.awayClubId,
    homeClubSlug: homeClub?.slug ?? "",
    awayClubSlug: awayClub?.slug ?? "",
    homeTeamName: homeClub?.name ?? "Unknown",
    awayTeamName: awayClub?.name ?? "Unknown",
    homeTeamLogo,
    awayTeamLogo,
    homeTeamColor: homeClub?.colors?.[0] ?? undefined,
    awayTeamColor: awayClub?.colors?.[0] ?? undefined,
    date: game.date,
    startTime: game.startTime,
    category: game.category,
    gender: game.gender,
    locationName: game.locationName,
    locationCoordinates: game.locationCoordinates,
    status: normalizeGameStatus(game.status),
    homeScore: game.homeScore,
    awayScore: game.awayScore,
    matchStartedAt: game.matchStartedAt,
    matchEndedAt: game.matchEndedAt,
    matchPhase: game.matchPhase,
    firstHalfStartedAt: game.firstHalfStartedAt,
    firstHalfEndedAt: game.firstHalfEndedAt,
    secondHalfStartedAt: game.secondHalfStartedAt,
    secondHalfEndedAt: game.secondHalfEndedAt,
    firstHalfAddedMinutes: game.firstHalfAddedMinutes,
    secondHalfAddedMinutes: game.secondHalfAddedMinutes,
  };
}
