import type { QueryCtx } from "../../_generated/server";
import type { Doc, Id } from "../../_generated/dataModel";
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
import {
  buildSeasonStatsAggregate,
  buildSeasonTeamStandings,
} from "./season_stats";
import {
  buildTeamTotals,
  isIsoDateString,
  isOperationallyCompleted,
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

const PUBLIC_LIVE_PREVIEW_LIMIT = 3;
const PUBLIC_DIRECTORY_LIVE_LIMIT = 12;
const PUBLIC_GAME_GROUP_LIMIT = 24;
const PUBLIC_STANDINGS_LIMIT = 20;
const PUBLIC_STANDINGS_GAME_LIMIT = 500;
const PUBLIC_GAME_EVENT_LIMIT = 200;
const PUBLIC_GAME_PLAYER_STATS_LIMIT = 100;
const PUBLIC_GAME_TEAM_STATS_LIMIT = 4;
const PUBLIC_LINEUP_STARTER_LIMIT = 11;
const PUBLIC_LINEUP_SUBSTITUTE_LIMIT = 20;
const PUBLIC_BOX_SCORE_PLAYER_LIMIT = 31;

type ClubMap = Map<Id<"clubs">, Doc<"clubs">>;
type ClubLogoMap = Map<Id<"clubs">, string | undefined>;

type StoredGameStatus = Doc<"games">["status"];

const EMPTY_PUBLIC_GAME_GROUPS = {
  live: [],
  upcoming: [],
  recent: [],
};

async function getPublicOrganization(ctx: QueryCtx, orgSlug: string) {
  return ctx.db
    .query("organizations")
    .withIndex("bySlug", (q) => q.eq("slug", orgSlug))
    .unique();
}

function compareGameDateTime(left: Doc<"games">, right: Doc<"games">) {
  return `${left.date}T${left.startTime}`.localeCompare(
    `${right.date}T${right.startTime}`,
  );
}

async function loadPublicLiveGames(
  ctx: QueryCtx,
  organizationId: Id<"organizations">,
  limit: number,
) {
  const [inProgressGames, halftimeGames] = await Promise.all([
    ctx.db
      .query("games")
      .withIndex("byOrganizationStatusDateTime", (q) =>
        q.eq("organizationId", organizationId).eq("status", "in_progress"),
      )
      .order("desc")
      .take(limit),
    ctx.db
      .query("games")
      .withIndex("byOrganizationStatusDateTime", (q) =>
        q.eq("organizationId", organizationId).eq("status", "halftime"),
      )
      .order("desc")
      .take(limit),
  ]);

  return [...inProgressGames, ...halftimeGames]
    .sort((left, right) => compareGameDateTime(right, left))
    .slice(0, limit);
}

function loadPublicGamesByStatus(
  ctx: QueryCtx,
  organizationId: Id<"organizations">,
  status: StoredGameStatus,
  anchorDate: string,
  order: "asc" | "desc",
) {
  return ctx.db
    .query("games")
    .withIndex("byOrganizationStatusDateTime", (q) => {
      const statusQuery = q
        .eq("organizationId", organizationId)
        .eq("status", status);
      return order === "asc"
        ? statusQuery.gte("date", anchorDate)
        : statusQuery.lte("date", anchorDate);
    })
    .order(order)
    .take(PUBLIC_GAME_GROUP_LIMIT);
}

function hasValidPublicTeams(game: Doc<"games">, clubMap: ClubMap) {
  const homeClub = clubMap.get(game.homeClubId);
  const awayClub = clubMap.get(game.awayClubId);

  return (
    homeClub?.organizationId === game.organizationId &&
    awayClub?.organizationId === game.organizationId
  );
}

function publicTeamColor(color?: string) {
  return color && /^#[0-9a-f]{6}$/i.test(color) ? color : undefined;
}

function buildPublicGameSummary(
  game: Doc<"games">,
  clubMap: ClubMap,
  clubLogoMap: ClubLogoMap,
) {
  const homeClub = clubMap.get(game.homeClubId)!;
  const awayClub = clubMap.get(game.awayClubId)!;

  return {
    id: game._id,
    date: game.date,
    startTime: game.startTime,
    category: game.category,
    gender: game.gender,
    status: normalizeGameStatus(game.status),
    homeScore: game.homeScore ?? 0,
    awayScore: game.awayScore ?? 0,
    matchStartedAt: game.matchStartedAt,
    matchEndedAt: game.matchEndedAt,
    matchPhase: game.matchPhase,
    firstHalfStartedAt: game.firstHalfStartedAt,
    firstHalfEndedAt: game.firstHalfEndedAt,
    secondHalfStartedAt: game.secondHalfStartedAt,
    secondHalfEndedAt: game.secondHalfEndedAt,
    firstHalfAddedMinutes: game.firstHalfAddedMinutes,
    secondHalfAddedMinutes: game.secondHalfAddedMinutes,
    homeTeam: {
      name: homeClub.name,
      logoUrl: clubLogoMap.get(homeClub._id),
      color: publicTeamColor(homeClub.colors?.[0]),
    },
    awayTeam: {
      name: awayClub.name,
      logoUrl: clubLogoMap.get(awayClub._id),
      color: publicTeamColor(awayClub.colors?.[0]),
    },
  };
}

async function buildPublicLineup(
  ctx: QueryCtx,
  side: "home" | "away",
  clubId: Id<"clubs">,
  row: Doc<"gameLineups"> | null,
  stats: Array<Doc<"gamePlayerStats">>,
  positionNameById: Map<string, string>,
) {
  const sourceIds = [
    ...(row?.starterPlayerIds ?? []).slice(0, PUBLIC_LINEUP_STARTER_LIMIT),
    ...(row?.substitutePlayerIds ?? []).slice(
      0,
      PUBLIC_LINEUP_SUBSTITUTE_LIMIT,
    ),
    ...(row?.slots ?? [])
      .slice(0, PUBLIC_LINEUP_STARTER_LIMIT)
      .flatMap((slot) => (slot.playerId ? [slot.playerId] : [])),
    ...stats.slice(0, PUBLIC_BOX_SCORE_PLAYER_LIMIT).map((stat) => stat.playerId),
  ];
  const playerIds = [...new Set(sourceIds)];
  const playerDocs = await Promise.all(playerIds.map((id) => ctx.db.get(id)));
  const players = playerDocs.filter(
    (player): player is NonNullable<typeof player> =>
      player !== null &&
      player.clubId === clubId &&
      player.sportType === "soccer",
  );
  const playerKeyById = new Map(
    players.map((player, index) => [player._id, `${side}:${index + 1}`]),
  );
  const photoEntries = await Promise.all(
    players.map(
      async (player) =>
        [
          player._id,
          player.photoStorageId
            ? ((await ctx.storage.getUrl(player.photoStorageId)) ?? undefined)
            : undefined,
        ] as const,
    ),
  );
  const photoById = new Map(photoEntries);
  const playerById = new Map(players.map((player) => [player._id, player]));
  const toPublicPlayer = (playerId: Id<"players">) => {
    const player = playerById.get(playerId);
    const playerKey = playerKeyById.get(playerId);
    if (!player || !playerKey) {
      return null;
    }
    return {
      playerId: playerKey,
      playerName: buildPlayerFullName(
        player.firstName,
        player.lastName,
        player.secondLastName,
      ),
      lastName: player.lastName,
      jerseyNumber: player.jerseyNumber,
      photoUrl: photoById.get(playerId),
      position: player.position
        ? positionNameById.get(player.position)
        : undefined,
    };
  };
  const publicPlayerById = new Map(
    players.flatMap((player) => {
      const publicPlayer = toPublicPlayer(player._id);
      return publicPlayer ? [[player._id, publicPlayer] as const] : [];
    }),
  );
  const mapPlayers = (ids: Array<Id<"players">>) =>
    ids.flatMap((id) => {
      const player = publicPlayerById.get(id);
      return player ? [player] : [];
    });

  const starterIds = row
    ? row.starterPlayerIds.slice(0, PUBLIC_LINEUP_STARTER_LIMIT)
    : stats
        .filter((stat) => stat.isStarter)
        .slice(0, PUBLIC_LINEUP_STARTER_LIMIT)
        .map((stat) => stat.playerId);
  const substituteIds = row
    ? row.substitutePlayerIds.slice(0, PUBLIC_LINEUP_SUBSTITUTE_LIMIT)
    : stats
        .filter((stat) => !stat.isStarter)
        .slice(0, PUBLIC_LINEUP_SUBSTITUTE_LIMIT)
        .map((stat) => stat.playerId);
  const slots = (row?.slots ?? [])
    .slice(0, PUBLIC_LINEUP_STARTER_LIMIT)
    .flatMap((slot, index) => {
      if (
        !Number.isFinite(slot.x) ||
        !Number.isFinite(slot.y) ||
        slot.x < 0 ||
        slot.x > 100 ||
        slot.y < 0 ||
        slot.y > 100
      ) {
        return [];
      }
      const player = slot.playerId ? toPublicPlayer(slot.playerId) : null;
      return [
        {
          id: `${side}-slot-${index + 1}`,
          x: slot.x,
          y: slot.y,
          role: slot.role,
          ...(player ? { player } : {}),
        },
      ];
    });

  return {
    lineup: {
      formation: row?.formation?.trim() || undefined,
      slots,
      starters: mapPlayers(starterIds),
      substitutes: mapPlayers(substituteIds),
    },
    playerKeyById,
    publicPlayerById,
  };
}

export async function listPublicLiveHandler(
  ctx: QueryCtx,
  args: { orgSlug: string },
) {
  const organization = await getPublicOrganization(ctx, args.orgSlug);
  if (!organization) {
    return [];
  }

  const games = await loadPublicLiveGames(
    ctx,
    organization._id,
    PUBLIC_LIVE_PREVIEW_LIMIT,
  );
  const { clubMap, clubLogoMap } = await loadClubsWithLogos(
    ctx,
    games.flatMap((game) => [game.homeClubId, game.awayClubId]),
  );

  return games.flatMap((game) =>
    hasValidPublicTeams(game, clubMap)
      ? [buildPublicGameSummary(game, clubMap, clubLogoMap)]
      : [],
  );
}

export async function listPublicGamesHandler(
  ctx: QueryCtx,
  args: { orgSlug: string; anchorDate: string },
) {
  if (!isIsoDateString(args.anchorDate)) {
    return EMPTY_PUBLIC_GAME_GROUPS;
  }

  const organization = await getPublicOrganization(ctx, args.orgSlug);
  if (!organization) {
    return EMPTY_PUBLIC_GAME_GROUPS;
  }

  const [live, upcoming, completed, awaitingStats, pendingReview] =
    await Promise.all([
      loadPublicLiveGames(ctx, organization._id, PUBLIC_DIRECTORY_LIVE_LIMIT),
      loadPublicGamesByStatus(
        ctx,
        organization._id,
        "scheduled",
        args.anchorDate,
        "asc",
      ),
      loadPublicGamesByStatus(
        ctx,
        organization._id,
        "completed",
        args.anchorDate,
        "desc",
      ),
      loadPublicGamesByStatus(
        ctx,
        organization._id,
        "awaiting_stats",
        args.anchorDate,
        "desc",
      ),
      loadPublicGamesByStatus(
        ctx,
        organization._id,
        "pending_review",
        args.anchorDate,
        "desc",
      ),
    ]);

  const recent = [...completed, ...awaitingStats, ...pendingReview]
    .sort((left, right) => compareGameDateTime(right, left))
    .slice(0, PUBLIC_GAME_GROUP_LIMIT);
  const allGames = [...live, ...upcoming, ...recent];
  const { clubMap, clubLogoMap } = await loadClubsWithLogos(
    ctx,
    allGames.flatMap((game) => [game.homeClubId, game.awayClubId]),
  );
  const toPublicGames = (games: Array<Doc<"games">>) =>
    games.flatMap((game) =>
      hasValidPublicTeams(game, clubMap)
        ? [buildPublicGameSummary(game, clubMap, clubLogoMap)]
        : [],
    );

  return {
    live: toPublicGames(live),
    upcoming: toPublicGames(upcoming.sort(compareGameDateTime)),
    recent: toPublicGames(recent),
  };
}

export async function getPublicSeasonTableHandler(
  ctx: QueryCtx,
  args: { orgSlug: string },
) {
  const organization = await getPublicOrganization(ctx, args.orgSlug);
  if (!organization) {
    return null;
  }

  const settings = await ctx.db
    .query("leagueSettings")
    .withIndex("byOrganization", (q) =>
      q.eq("organizationId", organization._id),
    )
    .unique();
  const season = [...(settings?.seasons ?? [])].sort((left, right) =>
    right.startDate.localeCompare(left.startDate),
  )[0];
  if (!season) {
    return null;
  }

  const seasonGames = await ctx.db
    .query("games")
    .withIndex("byOrganizationAndSeason", (q) =>
      q.eq("organizationId", organization._id).eq("seasonId", season.id),
    )
    .take(PUBLIC_STANDINGS_GAME_LIMIT + 1);
  if (seasonGames.length > PUBLIC_STANDINGS_GAME_LIMIT) {
    return null;
  }

  const { clubMap, clubLogoMap } = await loadClubsWithLogos(
    ctx,
    seasonGames.flatMap((game) => [game.homeClubId, game.awayClubId]),
  );
  const completedGames = seasonGames.filter(
    (game) =>
      hasValidPublicTeams(game, clubMap) &&
      isOperationallyCompleted(game.status) &&
      typeof game.homeScore === "number" &&
      typeof game.awayScore === "number",
  );
  const standings = buildSeasonTeamStandings(completedGames);
  const teams = Array.from(standings.values())
    .flatMap((row) => {
      const club = clubMap.get(row.clubId);
      if (club?.organizationId !== organization._id) {
        return [];
      }
      return [
        {
          name: club.name,
          logoUrl: clubLogoMap.get(row.clubId),
          gamesPlayed: row.gamesPlayed,
          wins: row.wins,
          draws: row.draws,
          losses: row.losses,
          goalsFor: row.goalsFor,
          goalsAgainst: row.goalsAgainst,
          goalDifference: row.goalsFor - row.goalsAgainst,
          points: row.points,
        },
      ];
    })
    .sort((left, right) => {
      if (right.points !== left.points) {
        return right.points - left.points;
      }
      if (right.goalDifference !== left.goalDifference) {
        return right.goalDifference - left.goalDifference;
      }
      if (right.goalsFor !== left.goalsFor) {
        return right.goalsFor - left.goalsFor;
      }
      return left.name.localeCompare(right.name);
    })
    .slice(0, PUBLIC_STANDINGS_LIMIT);

  return {
    season: {
      name: season.name,
      startDate: season.startDate,
      endDate: season.endDate,
    },
    gamesCount: completedGames.length,
    teams,
  };
}

export async function getPublicByIdHandler(
  ctx: QueryCtx,
  args: { orgSlug: string; gameId: string },
) {
  const gameId = ctx.db.normalizeId("games", args.gameId);
  if (!gameId) {
    return null;
  }

  const [game, organization] = await Promise.all([
    ctx.db.get(gameId),
    getPublicOrganization(ctx, args.orgSlug),
  ]);
  if (!game || !organization || game.organizationId !== organization._id) {
    return null;
  }

  const [
    { clubMap, clubLogoMap },
    gameEvents,
    playerStats,
    teamStatsRows,
    homeLineupRow,
    awayLineupRow,
    leagueSettings,
  ] = await Promise.all([
    loadClubsWithLogos(ctx, [game.homeClubId, game.awayClubId]),
    ctx.db
      .query("gameEvents")
      .withIndex("byGame", (q) => q.eq("gameId", game._id))
      .order("asc")
      .take(PUBLIC_GAME_EVENT_LIMIT),
    ctx.db
      .query("gamePlayerStats")
      .withIndex("byGame", (q) => q.eq("gameId", game._id))
      .take(PUBLIC_GAME_PLAYER_STATS_LIMIT),
    ctx.db
      .query("gameTeamStats")
      .withIndex("byGame", (q) => q.eq("gameId", game._id))
      .take(PUBLIC_GAME_TEAM_STATS_LIMIT),
    ctx.db
      .query("gameLineups")
      .withIndex("byGameAndClub", (q) =>
        q.eq("gameId", game._id).eq("clubId", game.homeClubId),
      )
      .unique(),
    ctx.db
      .query("gameLineups")
      .withIndex("byGameAndClub", (q) =>
        q.eq("gameId", game._id).eq("clubId", game.awayClubId),
      )
      .unique(),
    ctx.db
      .query("leagueSettings")
      .withIndex("byOrganization", (q) =>
        q.eq("organizationId", organization._id),
      )
      .unique(),
  ]);

  if (!hasValidPublicTeams(game, clubMap)) {
    return null;
  }

  const participatingClubIds = new Set([game.homeClubId, game.awayClubId]);
  const positionNameById = new Map(
    (leagueSettings?.positions ?? []).map((position) => [
      position.id,
      position.name,
    ]),
  );
  const validPlayerStats = playerStats.filter((stat) =>
    participatingClubIds.has(stat.clubId),
  );
  const homePlayerStats = validPlayerStats
    .filter((stat) => stat.clubId === game.homeClubId)
    .slice(0, PUBLIC_BOX_SCORE_PLAYER_LIMIT);
  const awayPlayerStats = validPlayerStats
    .filter((stat) => stat.clubId === game.awayClubId)
    .slice(0, PUBLIC_BOX_SCORE_PLAYER_LIMIT);
  const [homeLineup, awayLineup] = await Promise.all([
    buildPublicLineup(
      ctx,
      "home",
      game.homeClubId,
      homeLineupRow,
      homePlayerStats,
      positionNameById,
    ),
    buildPublicLineup(
      ctx,
      "away",
      game.awayClubId,
      awayLineupRow,
      awayPlayerStats,
      positionNameById,
    ),
  ]);
  const validGameEvents = gameEvents
    .filter(
      (event) =>
        event.organizationId === game.organizationId &&
        participatingClubIds.has(event.clubId),
    )
    .sort(
      (left, right) =>
        left.minute - right.minute || left._creationTime - right._creationTime,
    );
  const events = validGameEvents.map((event, sequence) => {
      const side =
        event.clubId === game.homeClubId
          ? ("home" as const)
          : ("away" as const);
      const playerKeyById =
        side === "home" ? homeLineup.playerKeyById : awayLineup.playerKeyById;
      return {
        sequence,
        side,
        type: event.eventType,
        minute: event.minute,
        playerId: playerKeyById.get(event.playerId),
        relatedPlayerId: event.relatedPlayerId
          ? playerKeyById.get(event.relatedPlayerId)
          : undefined,
      };
  });
  const teamStatsByClub = new Map(
    teamStatsRows
      .filter((row) => participatingClubIds.has(row.clubId))
      .map((row) => [row.clubId, row]),
  );
  const homeTeamStats = buildTeamTotals(
    game.homeClubId,
    game,
    validPlayerStats,
    teamStatsByClub.get(game.homeClubId) ?? null,
  );
  const awayTeamStats = buildTeamTotals(
    game.awayClubId,
    game,
    validPlayerStats,
    teamStatsByClub.get(game.awayClubId) ?? null,
  );
  const initialOnFieldByClub = new Map<Id<"clubs">, Set<Id<"players">>>([
    [
      game.homeClubId,
      new Set(
        homePlayerStats
          .filter((stat) => stat.isStarter)
          .map((stat) => stat.playerId),
      ),
    ],
    [
      game.awayClubId,
      new Set(
        awayPlayerStats
          .filter((stat) => stat.isStarter)
          .map((stat) => stat.playerId),
      ),
    ],
  ]);
  const substitutionCounts = buildSubstitutionCountsFromEvents({
    events: validGameEvents,
    initialOnFieldByClub,
  });
  const toPublicPlayerStats = (
    stats: Array<Doc<"gamePlayerStats">>,
    lineup: typeof homeLineup,
  ) =>
    stats.filter(didPlayerParticipate).flatMap((stat) => {
      const playerId = lineup.playerKeyById.get(stat.playerId);
      const player = lineup.publicPlayerById.get(stat.playerId);
      if (!playerId || !player) {
        return [];
      }
      const substitutions = substitutionCounts.get(stat.playerId);
      return [
        {
          playerId,
          playerName: player.playerName,
          isStarter: stat.isStarter,
          goals: stat.goals,
          yellowCards: stat.yellowCards,
          redCards: stat.redCards,
          penaltiesAttempted: stat.penaltiesAttempted,
          penaltiesScored: stat.penaltiesScored,
          substitutionsIn:
            substitutions?.substitutionsIn ?? stat.substitutionsIn,
          substitutionsOut:
            substitutions?.substitutionsOut ?? stat.substitutionsOut,
        },
      ];
    });
  const toPublicTeamStats = (stats: typeof homeTeamStats) => ({
    goals: stats.goals,
    corners: stats.corners,
    freeKicks: stats.freeKicks,
    yellowCards: stats.yellowCards,
    redCards: stats.redCards,
    penaltiesAttempted: stats.penaltiesAttempted,
    penaltiesScored: stats.penaltiesScored,
    substitutions: stats.substitutions,
  });

  return {
    ...buildPublicGameSummary(game, clubMap, clubLogoMap),
    lineups: {
      home: homeLineup.lineup,
      away: awayLineup.lineup,
    },
    teamStats: {
      home: toPublicTeamStats(homeTeamStats),
      away: toPublicTeamStats(awayTeamStats),
    },
    playerStats: {
      home: toPublicPlayerStats(homePlayerStats, homeLineup),
      away: toPublicPlayerStats(awayPlayerStats, awayLineup),
    },
    events,
  };
}

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
