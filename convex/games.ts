import { v } from "convex/values";
import {
  query,
  mutation,
  type QueryCtx,
  type MutationCtx,
} from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { getCurrentUser } from "./lib/auth";
import {
  hasClubStaffAccess,
  hasOrgAdminAccess,
  requireOrgAccess,
  requireOrgAdmin,
  requireClubAccessBySlug,
} from "./lib/permissions";

type PermissionCtx = QueryCtx | MutationCtx;

// ============================================================================
// VALIDATORS
// ============================================================================

const gender = v.union(
  v.literal("male"),
  v.literal("female"),
  v.literal("mixed"),
);

const gameStatus = v.union(
  v.literal("scheduled"),
  v.literal("awaiting_stats"),
  v.literal("pending_review"),
  v.literal("completed"),
  v.literal("cancelled"),
);

const gameType = v.union(v.literal("quick"), v.literal("season"));

const gameValidator = v.object({
  _id: v.id("games"),
  _creationTime: v.number(),
  organizationId: v.id("organizations"),
  seasonId: v.optional(v.string()),
  homeClubId: v.id("clubs"),
  awayClubId: v.id("clubs"),
  homeClubSlug: v.string(),
  awayClubSlug: v.string(),
  homeTeamName: v.string(),
  awayTeamName: v.string(),
  homeTeamLogo: v.optional(v.string()),
  awayTeamLogo: v.optional(v.string()),
  homeTeamColor: v.optional(v.string()),
  awayTeamColor: v.optional(v.string()),
  date: v.string(),
  startTime: v.string(),
  category: v.string(),
  gender: gender,
  locationName: v.optional(v.string()),
  locationCoordinates: v.optional(v.array(v.number())),
  status: gameStatus,
  homeScore: v.optional(v.number()),
  awayScore: v.optional(v.number()),
  homeStatsSubmittedAt: v.optional(v.number()),
  awayStatsSubmittedAt: v.optional(v.number()),
  homeStatsConfirmed: v.optional(v.boolean()),
  awayStatsConfirmed: v.optional(v.boolean()),
});

const gameListItemValidator = v.object({
  _id: v.id("games"),
  _creationTime: v.number(),
  seasonId: v.optional(v.string()),
  gameType: gameType,
  homeTeamId: v.string(),
  homeTeamName: v.string(),
  homeTeamLogo: v.optional(v.string()),
  awayTeamId: v.string(),
  awayTeamName: v.string(),
  awayTeamLogo: v.optional(v.string()),
  date: v.string(),
  startTime: v.string(),
  category: v.string(),
  gender: gender,
  locationName: v.optional(v.string()),
  locationCoordinates: v.optional(v.array(v.number())),
  status: gameStatus,
  homeScore: v.optional(v.number()),
  awayScore: v.optional(v.number()),
});

const seasonValidator = v.object({
  id: v.string(),
  name: v.string(),
  startDate: v.string(),
  endDate: v.string(),
});

const seasonPlayerLeaderValidator = v.object({
  playerId: v.id("players"),
  playerName: v.string(),
  photoUrl: v.optional(v.string()),
  clubId: v.id("clubs"),
  clubName: v.string(),
  gamesPlayed: v.number(),
  points: v.number(),
  rebounds: v.number(),
  assists: v.number(),
  steals: v.number(),
  blocks: v.number(),
  pointsPerGame: v.number(),
  reboundsPerGame: v.number(),
  assistsPerGame: v.number(),
  stealsPerGame: v.number(),
  blocksPerGame: v.number(),
});

const seasonTeamLeaderValidator = v.object({
  clubId: v.id("clubs"),
  clubName: v.string(),
  gamesPlayed: v.number(),
  statGamesPlayed: v.number(),
  wins: v.number(),
  losses: v.number(),
  winPct: v.number(),
  pointsForPerGame: v.number(),
  pointsAllowedPerGame: v.number(),
  reboundsPerGame: v.number(),
  assistsPerGame: v.number(),
  stealsPerGame: v.number(),
  blocksPerGame: v.number(),
});

const seasonPlayerStatsRowValidator = v.object({
  playerId: v.id("players"),
  playerName: v.string(),
  photoUrl: v.optional(v.string()),
  clubId: v.id("clubs"),
  clubName: v.string(),
  clubNickname: v.optional(v.string()),
  gamesPlayed: v.number(),
  starts: v.number(),
  minutes: v.number(),
  minutesPerGame: v.number(),
  points: v.number(),
  pointsPerGame: v.number(),
  rebounds: v.number(),
  reboundsPerGame: v.number(),
  assists: v.number(),
  assistsPerGame: v.number(),
  steals: v.number(),
  stealsPerGame: v.number(),
  blocks: v.number(),
  blocksPerGame: v.number(),
  turnovers: v.number(),
  turnoversPerGame: v.number(),
  personalFouls: v.number(),
  personalFoulsPerGame: v.number(),
  plusMinus: v.number(),
  plusMinusPerGame: v.number(),
  fieldGoalsMade: v.number(),
  fieldGoalsAttempted: v.number(),
  fgPct: v.number(),
  threePointersMade: v.number(),
  threePointersAttempted: v.number(),
  threePct: v.number(),
  freeThrowsMade: v.number(),
  freeThrowsAttempted: v.number(),
  ftPct: v.number(),
});

const seasonTeamStatsRowValidator = v.object({
  clubId: v.id("clubs"),
  clubName: v.string(),
  clubNickname: v.optional(v.string()),
  clubLogoUrl: v.optional(v.string()),
  gamesPlayed: v.number(),
  statGamesPlayed: v.number(),
  wins: v.number(),
  losses: v.number(),
  winPct: v.number(),
  pointsFor: v.number(),
  pointsAgainst: v.number(),
  pointsForPerGame: v.number(),
  pointsAllowedPerGame: v.number(),
  rebounds: v.number(),
  reboundsPerGame: v.number(),
  assists: v.number(),
  assistsPerGame: v.number(),
  steals: v.number(),
  stealsPerGame: v.number(),
  blocks: v.number(),
  blocksPerGame: v.number(),
  turnovers: v.number(),
  turnoversPerGame: v.number(),
  fieldGoalsMade: v.number(),
  fieldGoalsAttempted: v.number(),
  fgPct: v.number(),
  threePointersMade: v.number(),
  threePointersAttempted: v.number(),
  threePct: v.number(),
  freeThrowsMade: v.number(),
  freeThrowsAttempted: v.number(),
  ftPct: v.number(),
});

type SeasonPlayerLeader = {
  playerId: Id<"players">;
  playerName: string;
  photoUrl?: string;
  clubId: Id<"clubs">;
  clubName: string;
  gamesPlayed: number;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  pointsPerGame: number;
  reboundsPerGame: number;
  assistsPerGame: number;
  stealsPerGame: number;
  blocksPerGame: number;
};

type SeasonPlayerStatsRow = {
  playerId: Id<"players">;
  playerName: string;
  photoUrl?: string;
  clubId: Id<"clubs">;
  clubName: string;
  clubNickname?: string;
  gamesPlayed: number;
  starts: number;
  minutes: number;
  minutesPerGame: number;
  points: number;
  pointsPerGame: number;
  rebounds: number;
  reboundsPerGame: number;
  assists: number;
  assistsPerGame: number;
  steals: number;
  stealsPerGame: number;
  blocks: number;
  blocksPerGame: number;
  turnovers: number;
  turnoversPerGame: number;
  personalFouls: number;
  personalFoulsPerGame: number;
  plusMinus: number;
  plusMinusPerGame: number;
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  fgPct: number;
  threePointersMade: number;
  threePointersAttempted: number;
  threePct: number;
  freeThrowsMade: number;
  freeThrowsAttempted: number;
  ftPct: number;
};

type SeasonTeamLeader = {
  clubId: Id<"clubs">;
  clubName: string;
  gamesPlayed: number;
  statGamesPlayed: number;
  wins: number;
  losses: number;
  winPct: number;
  pointsForPerGame: number;
  pointsAllowedPerGame: number;
  reboundsPerGame: number;
  assistsPerGame: number;
  stealsPerGame: number;
  blocksPerGame: number;
};

type SeasonTeamStatsRow = {
  clubId: Id<"clubs">;
  clubName: string;
  clubNickname?: string;
  clubLogoUrl?: string;
  gamesPlayed: number;
  statGamesPlayed: number;
  wins: number;
  losses: number;
  winPct: number;
  pointsFor: number;
  pointsAgainst: number;
  pointsForPerGame: number;
  pointsAllowedPerGame: number;
  rebounds: number;
  reboundsPerGame: number;
  assists: number;
  assistsPerGame: number;
  steals: number;
  stealsPerGame: number;
  blocks: number;
  blocksPerGame: number;
  turnovers: number;
  turnoversPerGame: number;
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  fgPct: number;
  threePointersMade: number;
  threePointersAttempted: number;
  threePct: number;
  freeThrowsMade: number;
  freeThrowsAttempted: number;
  ftPct: number;
};

type SeasonPlayerLeaders = {
  pointsPerGame: Array<SeasonPlayerLeader>;
  reboundsPerGame: Array<SeasonPlayerLeader>;
  assistsPerGame: Array<SeasonPlayerLeader>;
  stealsPerGame: Array<SeasonPlayerLeader>;
  blocksPerGame: Array<SeasonPlayerLeader>;
};

type SeasonTeamLeaders = {
  pointsForPerGame: Array<SeasonTeamLeader>;
  pointsAllowedPerGame: Array<SeasonTeamLeader>;
  reboundsPerGame: Array<SeasonTeamLeader>;
  assistsPerGame: Array<SeasonTeamLeader>;
  winPct: Array<SeasonTeamLeader>;
};

type SeasonStatsAggregate = {
  season: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
  };
  gamesCount: number;
  playerRows: Array<SeasonPlayerStatsRow>;
  teamRows: Array<SeasonTeamStatsRow>;
};

async function requireGameAccess(
  ctx: PermissionCtx,
  game: {
    organizationId: Id<"organizations">;
    homeClubId: Id<"clubs">;
    awayClubId: Id<"clubs">;
  },
) {
  const user = await getCurrentUser(ctx);
  if (user.isSuperAdmin) {
    return user;
  }

  const isOrgAdmin = await hasOrgAdminAccess(
    ctx,
    user._id,
    game.organizationId,
  );
  if (isOrgAdmin) {
    return user;
  }

  const [homeAccess, awayAccess] = await Promise.all([
    hasClubStaffAccess(ctx, user._id, game.homeClubId),
    hasClubStaffAccess(ctx, user._id, game.awayClubId),
  ]);

  if (!homeAccess && !awayAccess) {
    throw new Error("You do not have access to this game");
  }

  return user;
}

async function requireGameAdminAccess(
  ctx: PermissionCtx,
  organizationId: Id<"organizations">,
) {
  const user = await getCurrentUser(ctx);
  if (user.isSuperAdmin) {
    return user;
  }

  const isOrgAdmin = await hasOrgAdminAccess(ctx, user._id, organizationId);
  if (!isOrgAdmin) {
    throw new Error("Admin access required");
  }

  return user;
}

async function loadClubsWithLogos(
  ctx: PermissionCtx,
  clubIds: Array<Id<"clubs">>,
) {
  const uniqueClubIds = [...new Set(clubIds)];
  const clubs = await Promise.all(uniqueClubIds.map((id) => ctx.db.get(id)));
  const clubEntries = clubs.filter((club): club is NonNullable<typeof club> =>
    Boolean(club),
  );
  const clubMap = new Map(clubEntries.map((club) => [club._id, club]));

  const logoEntries = await Promise.all(
    clubEntries.map(async (club) => {
      const logoUrl = club.logoStorageId
        ? ((await ctx.storage.getUrl(club.logoStorageId)) ?? undefined)
        : undefined;
      return [club._id, logoUrl] as const;
    }),
  );
  const clubLogoMap = new Map(logoEntries);

  return { clubMap, clubLogoMap };
}

function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function isIsoDateString(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

function roundToSingleDecimal(value: number): number {
  return Number(value.toFixed(1));
}

function topByMetric<T>(
  items: Array<T>,
  getValue: (item: T) => number,
  limit: number,
): Array<T> {
  return [...items]
    .sort((a, b) => {
      const diff = getValue(b) - getValue(a);
      if (diff !== 0) {
        return diff;
      }
      return 0;
    })
    .slice(0, limit);
}

function calculatePercentage(made: number, attempted: number): number {
  if (attempted <= 0) {
    return 0;
  }
  return roundToSingleDecimal((made / attempted) * 100);
}

async function buildSeasonStatsAggregate(
  ctx: QueryCtx,
  organizationId: Id<"organizations">,
  seasonId: string,
): Promise<SeasonStatsAggregate> {
  const settings = await ctx.db
    .query("leagueSettings")
    .withIndex("byOrganization", (q) => q.eq("organizationId", organizationId))
    .unique();

  const season = (settings?.seasons ?? []).find((item) => item.id === seasonId);
  if (!season) {
    throw new Error("Season not found");
  }

  const seasonGames = await ctx.db
    .query("games")
    .withIndex("byOrganizationAndSeason", (q) =>
      q.eq("organizationId", organizationId).eq("seasonId", seasonId),
    )
    .collect();

  const completedGames = seasonGames.filter(
    (game) =>
      game.status === "completed" &&
      typeof game.homeScore === "number" &&
      typeof game.awayScore === "number",
  );

  if (completedGames.length === 0) {
    return {
      season,
      gamesCount: 0,
      playerRows: [],
      teamRows: [],
    };
  }

  type PlayerSeasonAggregate = {
    playerId: Id<"players">;
    clubId: Id<"clubs">;
    gamesPlayed: number;
    starts: number;
    minutes: number;
    points: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    turnovers: number;
    personalFouls: number;
    plusMinus: number;
    fieldGoalsMade: number;
    fieldGoalsAttempted: number;
    threePointersMade: number;
    threePointersAttempted: number;
    freeThrowsMade: number;
    freeThrowsAttempted: number;
  };

  type TeamSeasonAggregate = {
    clubId: Id<"clubs">;
    gamesPlayed: number;
    statGamesPlayed: number;
    wins: number;
    losses: number;
    pointsFor: number;
    pointsAgainst: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    turnovers: number;
    fieldGoalsMade: number;
    fieldGoalsAttempted: number;
    threePointersMade: number;
    threePointersAttempted: number;
    freeThrowsMade: number;
    freeThrowsAttempted: number;
  };

  type TeamSingleGameTotals = {
    entries: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    turnovers: number;
    fieldGoalsMade: number;
    fieldGoalsAttempted: number;
    threePointersMade: number;
    threePointersAttempted: number;
    freeThrowsMade: number;
    freeThrowsAttempted: number;
  };

  const playerAggregates = new Map<Id<"players">, PlayerSeasonAggregate>();
  const teamAggregates = new Map<Id<"clubs">, TeamSeasonAggregate>();

  const getOrCreateTeamAggregate = (
    clubId: Id<"clubs">,
  ): TeamSeasonAggregate => {
    const existing = teamAggregates.get(clubId);
    if (existing) {
      return existing;
    }

    const created: TeamSeasonAggregate = {
      clubId,
      gamesPlayed: 0,
      statGamesPlayed: 0,
      wins: 0,
      losses: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      rebounds: 0,
      assists: 0,
      steals: 0,
      blocks: 0,
      turnovers: 0,
      fieldGoalsMade: 0,
      fieldGoalsAttempted: 0,
      threePointersMade: 0,
      threePointersAttempted: 0,
      freeThrowsMade: 0,
      freeThrowsAttempted: 0,
    };
    teamAggregates.set(clubId, created);
    return created;
  };

  const allGameStats = await Promise.all(
    completedGames.map((game) =>
      ctx.db
        .query("gamePlayerStats")
        .withIndex("byGame", (q) => q.eq("gameId", game._id))
        .collect(),
    ),
  );

  for (let index = 0; index < completedGames.length; index += 1) {
    const game = completedGames[index];
    const gameStats = allGameStats[index];
    const homeScore = game.homeScore ?? 0;
    const awayScore = game.awayScore ?? 0;

    const homeTeamAggregate = getOrCreateTeamAggregate(game.homeClubId);
    const awayTeamAggregate = getOrCreateTeamAggregate(game.awayClubId);

    homeTeamAggregate.gamesPlayed += 1;
    awayTeamAggregate.gamesPlayed += 1;
    homeTeamAggregate.pointsFor += homeScore;
    homeTeamAggregate.pointsAgainst += awayScore;
    awayTeamAggregate.pointsFor += awayScore;
    awayTeamAggregate.pointsAgainst += homeScore;

    if (homeScore > awayScore) {
      homeTeamAggregate.wins += 1;
      awayTeamAggregate.losses += 1;
    } else if (awayScore > homeScore) {
      awayTeamAggregate.wins += 1;
      homeTeamAggregate.losses += 1;
    }

    const teamSingleGameTotals = new Map<Id<"clubs">, TeamSingleGameTotals>();

    for (const stat of gameStats) {
      const minutes = stat.minutes ?? 0;
      const points = stat.points ?? 0;
      const rebounds =
        (stat.offensiveRebounds ?? 0) + (stat.defensiveRebounds ?? 0);
      const assists = stat.assists ?? 0;
      const steals = stat.steals ?? 0;
      const blocks = stat.blocks ?? 0;
      const turnovers = stat.turnovers ?? 0;
      const personalFouls = stat.personalFouls ?? 0;
      const plusMinus = stat.plusMinus ?? 0;
      const fieldGoalsMade = stat.fieldGoalsMade ?? 0;
      const fieldGoalsAttempted = stat.fieldGoalsAttempted ?? 0;
      const threePointersMade = stat.threePointersMade ?? 0;
      const threePointersAttempted = stat.threePointersAttempted ?? 0;
      const freeThrowsMade = stat.freeThrowsMade ?? 0;
      const freeThrowsAttempted = stat.freeThrowsAttempted ?? 0;

      const playerAggregate = playerAggregates.get(stat.playerId);
      if (playerAggregate) {
        playerAggregate.gamesPlayed += 1;
        playerAggregate.starts += stat.isStarter ? 1 : 0;
        playerAggregate.minutes += minutes;
        playerAggregate.points += points;
        playerAggregate.rebounds += rebounds;
        playerAggregate.assists += assists;
        playerAggregate.steals += steals;
        playerAggregate.blocks += blocks;
        playerAggregate.turnovers += turnovers;
        playerAggregate.personalFouls += personalFouls;
        playerAggregate.plusMinus += plusMinus;
        playerAggregate.fieldGoalsMade += fieldGoalsMade;
        playerAggregate.fieldGoalsAttempted += fieldGoalsAttempted;
        playerAggregate.threePointersMade += threePointersMade;
        playerAggregate.threePointersAttempted += threePointersAttempted;
        playerAggregate.freeThrowsMade += freeThrowsMade;
        playerAggregate.freeThrowsAttempted += freeThrowsAttempted;
      } else {
        playerAggregates.set(stat.playerId, {
          playerId: stat.playerId,
          clubId: stat.clubId,
          gamesPlayed: 1,
          starts: stat.isStarter ? 1 : 0,
          minutes,
          points,
          rebounds,
          assists,
          steals,
          blocks,
          turnovers,
          personalFouls,
          plusMinus,
          fieldGoalsMade,
          fieldGoalsAttempted,
          threePointersMade,
          threePointersAttempted,
          freeThrowsMade,
          freeThrowsAttempted,
        });
      }

      const teamGameTotals = teamSingleGameTotals.get(stat.clubId);
      if (teamGameTotals) {
        teamGameTotals.entries += 1;
        teamGameTotals.rebounds += rebounds;
        teamGameTotals.assists += assists;
        teamGameTotals.steals += steals;
        teamGameTotals.blocks += blocks;
        teamGameTotals.turnovers += turnovers;
        teamGameTotals.fieldGoalsMade += fieldGoalsMade;
        teamGameTotals.fieldGoalsAttempted += fieldGoalsAttempted;
        teamGameTotals.threePointersMade += threePointersMade;
        teamGameTotals.threePointersAttempted += threePointersAttempted;
        teamGameTotals.freeThrowsMade += freeThrowsMade;
        teamGameTotals.freeThrowsAttempted += freeThrowsAttempted;
      } else {
        teamSingleGameTotals.set(stat.clubId, {
          entries: 1,
          rebounds,
          assists,
          steals,
          blocks,
          turnovers,
          fieldGoalsMade,
          fieldGoalsAttempted,
          threePointersMade,
          threePointersAttempted,
          freeThrowsMade,
          freeThrowsAttempted,
        });
      }
    }

    for (const [clubId, totals] of teamSingleGameTotals) {
      const teamAggregate = teamAggregates.get(clubId);
      if (!teamAggregate || totals.entries === 0) {
        continue;
      }
      teamAggregate.statGamesPlayed += 1;
      teamAggregate.rebounds += totals.rebounds;
      teamAggregate.assists += totals.assists;
      teamAggregate.steals += totals.steals;
      teamAggregate.blocks += totals.blocks;
      teamAggregate.turnovers += totals.turnovers;
      teamAggregate.fieldGoalsMade += totals.fieldGoalsMade;
      teamAggregate.fieldGoalsAttempted += totals.fieldGoalsAttempted;
      teamAggregate.threePointersMade += totals.threePointersMade;
      teamAggregate.threePointersAttempted += totals.threePointersAttempted;
      teamAggregate.freeThrowsMade += totals.freeThrowsMade;
      teamAggregate.freeThrowsAttempted += totals.freeThrowsAttempted;
    }
  }

  const clubIds = new Set<Id<"clubs">>();
  for (const clubId of teamAggregates.keys()) {
    clubIds.add(clubId);
  }
  for (const playerAggregate of playerAggregates.values()) {
    clubIds.add(playerAggregate.clubId);
  }

  const clubDocs = await Promise.all(
    Array.from(clubIds).map((clubId) => ctx.db.get(clubId)),
  );
  const clubNameById = new Map<Id<"clubs">, string>();
  const clubNicknameById = new Map<Id<"clubs">, string>();
  const clubLogoById = new Map<Id<"clubs">, string>();
  for (const club of clubDocs) {
    if (club) {
      clubNameById.set(club._id, club.name);
      if (club.nickname) {
        clubNicknameById.set(club._id, club.nickname);
      }
    }
  }

  await Promise.all(
    clubDocs.map(async (club) => {
      if (!club?.logoStorageId) {
        return;
      }
      const logoUrl = await ctx.storage.getUrl(club.logoStorageId);
      if (logoUrl) {
        clubLogoById.set(club._id, logoUrl);
      }
    }),
  );

  const playerIds = Array.from(playerAggregates.keys());
  const playerDocs = await Promise.all(
    playerIds.map((playerId) => ctx.db.get(playerId)),
  );
  const existingPlayers = playerDocs.filter(
    (player): player is NonNullable<typeof player> => Boolean(player),
  );

  const playerById = new Map(
    existingPlayers.map((player) => [player._id, player]),
  );
  const playerPhotoById = new Map<Id<"players">, string>();
  await Promise.all(
    existingPlayers.map(async (player) => {
      if (!player.photoStorageId) {
        return;
      }
      const photoUrl = await ctx.storage.getUrl(player.photoStorageId);
      if (photoUrl) {
        playerPhotoById.set(player._id, photoUrl);
      }
    }),
  );

  const playerRows = Array.from(playerAggregates.values())
    .filter((aggregate) => aggregate.gamesPlayed > 0)
    .map((aggregate) => {
      const player = playerById.get(aggregate.playerId);
      const gamesPlayed = aggregate.gamesPlayed;
      return {
        playerId: aggregate.playerId,
        playerName: player
          ? `${player.firstName} ${player.lastName}`
          : "Unknown",
        photoUrl: playerPhotoById.get(aggregate.playerId),
        clubId: aggregate.clubId,
        clubName: clubNameById.get(aggregate.clubId) ?? "Unknown",
        clubNickname: clubNicknameById.get(aggregate.clubId),
        gamesPlayed,
        starts: aggregate.starts,
        minutes: aggregate.minutes,
        minutesPerGame: roundToSingleDecimal(aggregate.minutes / gamesPlayed),
        points: aggregate.points,
        pointsPerGame: roundToSingleDecimal(aggregate.points / gamesPlayed),
        rebounds: aggregate.rebounds,
        reboundsPerGame: roundToSingleDecimal(aggregate.rebounds / gamesPlayed),
        assists: aggregate.assists,
        assistsPerGame: roundToSingleDecimal(aggregate.assists / gamesPlayed),
        steals: aggregate.steals,
        stealsPerGame: roundToSingleDecimal(aggregate.steals / gamesPlayed),
        blocks: aggregate.blocks,
        blocksPerGame: roundToSingleDecimal(aggregate.blocks / gamesPlayed),
        turnovers: aggregate.turnovers,
        turnoversPerGame: roundToSingleDecimal(
          aggregate.turnovers / gamesPlayed,
        ),
        personalFouls: aggregate.personalFouls,
        personalFoulsPerGame: roundToSingleDecimal(
          aggregate.personalFouls / gamesPlayed,
        ),
        plusMinus: aggregate.plusMinus,
        plusMinusPerGame: roundToSingleDecimal(
          aggregate.plusMinus / gamesPlayed,
        ),
        fieldGoalsMade: aggregate.fieldGoalsMade,
        fieldGoalsAttempted: aggregate.fieldGoalsAttempted,
        fgPct: calculatePercentage(
          aggregate.fieldGoalsMade,
          aggregate.fieldGoalsAttempted,
        ),
        threePointersMade: aggregate.threePointersMade,
        threePointersAttempted: aggregate.threePointersAttempted,
        threePct: calculatePercentage(
          aggregate.threePointersMade,
          aggregate.threePointersAttempted,
        ),
        freeThrowsMade: aggregate.freeThrowsMade,
        freeThrowsAttempted: aggregate.freeThrowsAttempted,
        ftPct: calculatePercentage(
          aggregate.freeThrowsMade,
          aggregate.freeThrowsAttempted,
        ),
      };
    })
    .sort((a, b) => {
      const diff = b.pointsPerGame - a.pointsPerGame;
      if (diff !== 0) {
        return diff;
      }
      return b.gamesPlayed - a.gamesPlayed;
    });

  const teamRows = Array.from(teamAggregates.values())
    .filter((aggregate) => aggregate.gamesPlayed > 0)
    .map((aggregate) => {
      const gamesPlayed = aggregate.gamesPlayed;
      const statGames = aggregate.statGamesPlayed || gamesPlayed;
      return {
        clubId: aggregate.clubId,
        clubName: clubNameById.get(aggregate.clubId) ?? "Unknown",
        clubNickname: clubNicknameById.get(aggregate.clubId),
        clubLogoUrl: clubLogoById.get(aggregate.clubId),
        gamesPlayed,
        statGamesPlayed: aggregate.statGamesPlayed,
        wins: aggregate.wins,
        losses: aggregate.losses,
        winPct: roundToSingleDecimal((aggregate.wins / gamesPlayed) * 100),
        pointsFor: aggregate.pointsFor,
        pointsAgainst: aggregate.pointsAgainst,
        pointsForPerGame: roundToSingleDecimal(
          aggregate.pointsFor / gamesPlayed,
        ),
        pointsAllowedPerGame: roundToSingleDecimal(
          aggregate.pointsAgainst / gamesPlayed,
        ),
        rebounds: aggregate.rebounds,
        reboundsPerGame: roundToSingleDecimal(aggregate.rebounds / statGames),
        assists: aggregate.assists,
        assistsPerGame: roundToSingleDecimal(aggregate.assists / statGames),
        steals: aggregate.steals,
        stealsPerGame: roundToSingleDecimal(aggregate.steals / statGames),
        blocks: aggregate.blocks,
        blocksPerGame: roundToSingleDecimal(aggregate.blocks / statGames),
        turnovers: aggregate.turnovers,
        turnoversPerGame: roundToSingleDecimal(aggregate.turnovers / statGames),
        fieldGoalsMade: aggregate.fieldGoalsMade,
        fieldGoalsAttempted: aggregate.fieldGoalsAttempted,
        fgPct: calculatePercentage(
          aggregate.fieldGoalsMade,
          aggregate.fieldGoalsAttempted,
        ),
        threePointersMade: aggregate.threePointersMade,
        threePointersAttempted: aggregate.threePointersAttempted,
        threePct: calculatePercentage(
          aggregate.threePointersMade,
          aggregate.threePointersAttempted,
        ),
        freeThrowsMade: aggregate.freeThrowsMade,
        freeThrowsAttempted: aggregate.freeThrowsAttempted,
        ftPct: calculatePercentage(
          aggregate.freeThrowsMade,
          aggregate.freeThrowsAttempted,
        ),
      };
    })
    .sort((a, b) => {
      const diff = b.winPct - a.winPct;
      if (diff !== 0) {
        return diff;
      }
      return b.pointsForPerGame - a.pointsForPerGame;
    });

  return {
    season,
    gamesCount: completedGames.length,
    playerRows,
    teamRows,
  };
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * List games by league (organization) slug.
 */
export const listByLeagueSlug = query({
  args: { orgSlug: v.string() },
  returns: v.array(gameListItemValidator),
  handler: async (ctx, args) => {
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

    const result: Array<{
      _id: Id<"games">;
      _creationTime: number;
      seasonId?: string;
      gameType: "quick" | "season";
      homeTeamId: string;
      homeTeamName: string;
      homeTeamLogo?: string;
      awayTeamId: string;
      awayTeamName: string;
      awayTeamLogo?: string;
      date: string;
      startTime: string;
      category: string;
      gender: "male" | "female" | "mixed";
      locationName?: string;
      locationCoordinates?: number[];
      status:
        | "scheduled"
        | "awaiting_stats"
        | "pending_review"
        | "completed"
        | "cancelled";
      homeScore?: number;
      awayScore?: number;
    }> = [];

    for (const game of games) {
      const homeClub = clubMap.get(game.homeClubId);
      const awayClub = clubMap.get(game.awayClubId);

      result.push({
        _id: game._id,
        _creationTime: game._creationTime,
        seasonId: game.seasonId,
        gameType: game.seasonId ? "season" : "quick",
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
        status: game.status,
        homeScore: game.homeScore,
        awayScore: game.awayScore,
      });
    }

    return result;
  },
});

/**
 * List games by club slug (where the club is either home or away team).
 */
export const listByClubSlug = query({
  args: { clubSlug: v.string() },
  returns: v.array(gameListItemValidator),
  handler: async (ctx, args) => {
    const { club } = await requireClubAccessBySlug(ctx, args.clubSlug);

    // Get games where club is home team
    const homeGames = await ctx.db
      .query("games")
      .withIndex("byHomeClub", (q) => q.eq("homeClubId", club._id))
      .collect();

    // Get games where club is away team
    const awayGames = await ctx.db
      .query("games")
      .withIndex("byAwayClub", (q) => q.eq("awayClubId", club._id))
      .collect();

    // Combine and deduplicate games
    const allGames = [...homeGames, ...awayGames];
    const uniqueGames = Array.from(
      new Map(allGames.map((g) => [g._id, g])).values(),
    );

    // Sort by date descending
    uniqueGames.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.startTime}`);
      const dateB = new Date(`${b.date}T${b.startTime}`);
      return dateB.getTime() - dateA.getTime();
    });

    const { clubMap, clubLogoMap } = await loadClubsWithLogos(
      ctx,
      uniqueGames.flatMap((game) => [game.homeClubId, game.awayClubId]),
    );

    const result: Array<{
      _id: Id<"games">;
      _creationTime: number;
      seasonId?: string;
      gameType: "quick" | "season";
      homeTeamId: string;
      homeTeamName: string;
      homeTeamLogo?: string;
      awayTeamId: string;
      awayTeamName: string;
      awayTeamLogo?: string;
      date: string;
      startTime: string;
      category: string;
      gender: "male" | "female" | "mixed";
      locationName?: string;
      locationCoordinates?: number[];
      status:
        | "scheduled"
        | "awaiting_stats"
        | "pending_review"
        | "completed"
        | "cancelled";
      homeScore?: number;
      awayScore?: number;
    }> = [];

    for (const game of uniqueGames) {
      const homeClub = clubMap.get(game.homeClubId);
      const awayClub = clubMap.get(game.awayClubId);

      result.push({
        _id: game._id,
        _creationTime: game._creationTime,
        seasonId: game.seasonId,
        gameType: game.seasonId ? "season" : "quick",
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
        status: game.status,
        homeScore: game.homeScore,
        awayScore: game.awayScore,
      });
    }

    return result;
  },
});

const playerStatsValidator = v.object({
  _id: v.id("gamePlayerStats"),
  playerId: v.id("players"),
  playerName: v.string(),
  jerseyNumber: v.optional(v.number()),
  photoUrl: v.optional(v.string()),
  clubId: v.id("clubs"),
  isStarter: v.boolean(),
  minutes: v.optional(v.number()),
  points: v.optional(v.number()),
  fieldGoalsMade: v.optional(v.number()),
  fieldGoalsAttempted: v.optional(v.number()),
  threePointersMade: v.optional(v.number()),
  threePointersAttempted: v.optional(v.number()),
  freeThrowsMade: v.optional(v.number()),
  freeThrowsAttempted: v.optional(v.number()),
  offensiveRebounds: v.optional(v.number()),
  defensiveRebounds: v.optional(v.number()),
  assists: v.optional(v.number()),
  steals: v.optional(v.number()),
  blocks: v.optional(v.number()),
  turnovers: v.optional(v.number()),
  personalFouls: v.optional(v.number()),
  plusMinus: v.optional(v.number()),
});

/**
 * Get player stats for a game.
 */
export const getGamePlayerStats = query({
  args: { gameId: v.id("games") },
  returns: v.object({
    homeStats: v.array(playerStatsValidator),
    awayStats: v.array(playerStatsValidator),
  }),
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      return { homeStats: [], awayStats: [] };
    }

    await requireGameAccess(ctx, game);

    const allStats = await ctx.db
      .query("gamePlayerStats")
      .withIndex("byGame", (q) => q.eq("gameId", args.gameId))
      .collect();

    // Batch fetch players
    const playerIds = [...new Set(allStats.map((s) => s.playerId))];
    const players = await Promise.all(playerIds.map((id) => ctx.db.get(id)));
    const playerMap = new Map(players.filter(Boolean).map((p) => [p!._id, p!]));

    // Get photo URLs
    const photoUrls = new Map<string, string>();
    for (const player of players.filter(Boolean)) {
      if (player!.photoStorageId) {
        const url = await ctx.storage.getUrl(player!.photoStorageId);
        if (url) {
          photoUrls.set(player!._id, url);
        }
      }
    }

    const mapStats = (stats: typeof allStats) =>
      stats.map((s) => {
        const player = playerMap.get(s.playerId);
        return {
          _id: s._id,
          playerId: s.playerId,
          playerName: player
            ? `${player.firstName} ${player.lastName}`
            : "Unknown",
          jerseyNumber: player?.jerseyNumber,
          photoUrl: photoUrls.get(s.playerId),
          clubId: s.clubId,
          isStarter: s.isStarter,
          minutes: s.minutes,
          points: s.points,
          fieldGoalsMade: s.fieldGoalsMade,
          fieldGoalsAttempted: s.fieldGoalsAttempted,
          threePointersMade: s.threePointersMade,
          threePointersAttempted: s.threePointersAttempted,
          freeThrowsMade: s.freeThrowsMade,
          freeThrowsAttempted: s.freeThrowsAttempted,
          offensiveRebounds: s.offensiveRebounds,
          defensiveRebounds: s.defensiveRebounds,
          assists: s.assists,
          steals: s.steals,
          blocks: s.blocks,
          turnovers: s.turnovers,
          personalFouls: s.personalFouls,
          plusMinus: s.plusMinus,
        };
      });

    const homeStats = mapStats(
      allStats.filter((s) => s.clubId === game.homeClubId),
    );
    const awayStats = mapStats(
      allStats.filter((s) => s.clubId === game.awayClubId),
    );

    return { homeStats, awayStats };
  },
});

/**
 * Get season leaders for players and teams.
 * Only completed season games are considered.
 */
export const getSeasonLeaders = query({
  args: {
    orgSlug: v.string(),
    seasonId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.object({
    season: seasonValidator,
    gamesCount: v.number(),
    leaderLimit: v.number(),
    playerLeaders: v.object({
      pointsPerGame: v.array(seasonPlayerLeaderValidator),
      reboundsPerGame: v.array(seasonPlayerLeaderValidator),
      assistsPerGame: v.array(seasonPlayerLeaderValidator),
      stealsPerGame: v.array(seasonPlayerLeaderValidator),
      blocksPerGame: v.array(seasonPlayerLeaderValidator),
    }),
    teamLeaders: v.object({
      pointsForPerGame: v.array(seasonTeamLeaderValidator),
      pointsAllowedPerGame: v.array(seasonTeamLeaderValidator),
      reboundsPerGame: v.array(seasonTeamLeaderValidator),
      assistsPerGame: v.array(seasonTeamLeaderValidator),
      winPct: v.array(seasonTeamLeaderValidator),
    }),
  }),
  handler: async (ctx, args) => {
    const { organization } = await requireOrgAccess(ctx, args.orgSlug);
    const rawLimit = Math.floor(args.limit ?? 10);
    const leaderLimit = Math.max(1, Math.min(20, rawLimit));

    const seasonStats = await buildSeasonStatsAggregate(
      ctx,
      organization._id,
      args.seasonId,
    );

    const season = seasonStats.season;

    const emptyPlayerLeaders: SeasonPlayerLeaders = {
      pointsPerGame: [],
      reboundsPerGame: [],
      assistsPerGame: [],
      stealsPerGame: [],
      blocksPerGame: [],
    };

    const emptyTeamLeaders: SeasonTeamLeaders = {
      pointsForPerGame: [],
      pointsAllowedPerGame: [],
      reboundsPerGame: [],
      assistsPerGame: [],
      winPct: [],
    };

    if (seasonStats.gamesCount === 0) {
      return {
        season,
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
        points: row.points,
        rebounds: row.rebounds,
        assists: row.assists,
        steals: row.steals,
        blocks: row.blocks,
        pointsPerGame: row.pointsPerGame,
        reboundsPerGame: row.reboundsPerGame,
        assistsPerGame: row.assistsPerGame,
        stealsPerGame: row.stealsPerGame,
        blocksPerGame: row.blocksPerGame,
      }));

    const teamLeaderRows: Array<SeasonTeamLeader> = seasonStats.teamRows.map(
      (row) => ({
        clubId: row.clubId,
        clubName: row.clubName,
        gamesPlayed: row.gamesPlayed,
        statGamesPlayed: row.statGamesPlayed,
        wins: row.wins,
        losses: row.losses,
        winPct: row.winPct,
        pointsForPerGame: row.pointsForPerGame,
        pointsAllowedPerGame: row.pointsAllowedPerGame,
        reboundsPerGame: row.reboundsPerGame,
        assistsPerGame: row.assistsPerGame,
        stealsPerGame: row.stealsPerGame,
        blocksPerGame: row.blocksPerGame,
      }),
    );

    return {
      season,
      gamesCount: seasonStats.gamesCount,
      leaderLimit,
      playerLeaders: {
        pointsPerGame: topByMetric(
          playerLeaderRows,
          (item) => item.pointsPerGame,
          leaderLimit,
        ),
        reboundsPerGame: topByMetric(
          playerLeaderRows,
          (item) => item.reboundsPerGame,
          leaderLimit,
        ),
        assistsPerGame: topByMetric(
          playerLeaderRows,
          (item) => item.assistsPerGame,
          leaderLimit,
        ),
        stealsPerGame: topByMetric(
          playerLeaderRows,
          (item) => item.stealsPerGame,
          leaderLimit,
        ),
        blocksPerGame: topByMetric(
          playerLeaderRows,
          (item) => item.blocksPerGame,
          leaderLimit,
        ),
      },
      teamLeaders: {
        pointsForPerGame: topByMetric(
          teamLeaderRows,
          (item) => item.pointsForPerGame,
          leaderLimit,
        ),
        pointsAllowedPerGame: topByMetric(
          teamLeaderRows,
          (item) => item.pointsAllowedPerGame * -1,
          leaderLimit,
        ),
        reboundsPerGame: topByMetric(
          teamLeaderRows,
          (item) => item.reboundsPerGame,
          leaderLimit,
        ),
        assistsPerGame: topByMetric(
          teamLeaderRows,
          (item) => item.assistsPerGame,
          leaderLimit,
        ),
        winPct: topByMetric(teamLeaderRows, (item) => item.winPct, leaderLimit),
      },
    };
  },
});

/**
 * Get detailed season stats for players and teams.
 * Only completed season games are considered.
 */
export const getSeasonStatsTable = query({
  args: {
    orgSlug: v.string(),
    seasonId: v.string(),
  },
  returns: v.object({
    season: seasonValidator,
    gamesCount: v.number(),
    players: v.array(seasonPlayerStatsRowValidator),
    teams: v.array(seasonTeamStatsRowValidator),
  }),
  handler: async (ctx, args) => {
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
  },
});

/**
 * Get a game by ID with team details.
 */
export const getById = query({
  args: { gameId: v.id("games") },
  returns: v.union(gameValidator, v.null()),
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);

    if (!game) {
      return null;
    }

    await requireGameAccess(ctx, game);

    const homeClub = await ctx.db.get(game.homeClubId);
    const awayClub = await ctx.db.get(game.awayClubId);

    let homeTeamLogo: string | undefined;
    let awayTeamLogo: string | undefined;

    if (homeClub?.logoStorageId) {
      homeTeamLogo =
        (await ctx.storage.getUrl(homeClub.logoStorageId)) ?? undefined;
    }
    if (awayClub?.logoStorageId) {
      awayTeamLogo =
        (await ctx.storage.getUrl(awayClub.logoStorageId)) ?? undefined;
    }

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
      status: game.status,
      homeScore: game.homeScore,
      awayScore: game.awayScore,
      homeStatsSubmittedAt: game.homeStatsSubmittedAt,
      awayStatsSubmittedAt: game.awayStatsSubmittedAt,
      homeStatsConfirmed: game.homeStatsConfirmed,
      awayStatsConfirmed: game.awayStatsConfirmed,
    };
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new game.
 */
export const create = mutation({
  args: {
    orgSlug: v.string(),
    seasonId: v.optional(v.string()),
    homeClubId: v.id("clubs"),
    awayClubId: v.id("clubs"),
    date: v.string(),
    startTime: v.string(),
    category: v.string(),
    gender: gender,
    locationName: v.optional(v.string()),
    locationCoordinates: v.optional(v.array(v.number())),
  },
  returns: v.id("games"),
  handler: async (ctx, args) => {
    const { organization } = await requireOrgAdmin(ctx, args.orgSlug);

    // Validate clubs exist and belong to org
    const homeClub = await ctx.db.get(args.homeClubId);
    const awayClub = await ctx.db.get(args.awayClubId);

    if (!homeClub || homeClub.organizationId !== organization._id) {
      throw new Error("Home club not found or doesn't belong to this league");
    }
    if (!awayClub || awayClub.organizationId !== organization._id) {
      throw new Error("Away club not found or doesn't belong to this league");
    }

    if (args.homeClubId === args.awayClubId) {
      throw new Error("Home and away clubs must be different");
    }

    if (!isIsoDateString(args.date)) {
      throw new Error("Game date must use YYYY-MM-DD format");
    }

    if (args.seasonId) {
      const settings = await ctx.db
        .query("leagueSettings")
        .withIndex("byOrganization", (q) =>
          q.eq("organizationId", organization._id),
        )
        .unique();

      const season = (settings?.seasons ?? []).find(
        (item) => item.id === args.seasonId,
      );
      if (!season) {
        throw new Error("Selected season not found");
      }

      const today = getTodayDateString();
      if (season.startDate > today || season.endDate < today) {
        throw new Error("Selected season is not currently active");
      }

      if (args.date < season.startDate || args.date > season.endDate) {
        throw new Error("Game date must be within the selected season range");
      }
    }

    return await ctx.db.insert("games", {
      organizationId: organization._id,
      seasonId: args.seasonId,
      homeClubId: args.homeClubId,
      awayClubId: args.awayClubId,
      date: args.date,
      startTime: args.startTime,
      category: args.category,
      gender: args.gender,
      locationName: args.locationName,
      locationCoordinates: args.locationCoordinates,
      status: "scheduled",
    });
  },
});

/**
 * Update game details.
 */
export const update = mutation({
  args: {
    gameId: v.id("games"),
    date: v.optional(v.string()),
    startTime: v.optional(v.string()),
    category: v.optional(v.string()),
    gender: v.optional(gender),
    locationName: v.optional(v.string()),
    locationCoordinates: v.optional(v.array(v.number())),
    status: v.optional(gameStatus),
    homeScore: v.optional(v.number()),
    awayScore: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    await requireGameAdminAccess(ctx, game.organizationId);

    const { gameId, ...updates } = args;

    // Filter out undefined values
    const filteredUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        filteredUpdates[key] = value;
      }
    }

    if (Object.keys(filteredUpdates).length > 0) {
      await ctx.db.patch(gameId, filteredUpdates);
    }

    return null;
  },
});

/**
 * Delete a game.
 */
export const remove = mutation({
  args: { gameId: v.id("games") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    await requireGameAdminAccess(ctx, game.organizationId);

    // Delete game player stats
    const stats = await ctx.db
      .query("gamePlayerStats")
      .withIndex("byGame", (q) => q.eq("gameId", args.gameId))
      .collect();

    for (const stat of stats) {
      await ctx.db.delete(stat._id);
    }

    // Delete the game
    await ctx.db.delete(args.gameId);

    return null;
  },
});

// ============================================================================
// STATS SUBMISSION
// ============================================================================

const playerStatInput = v.object({
  playerId: v.id("players"),
  isStarter: v.boolean(),
  minutes: v.optional(v.number()),
  points: v.optional(v.number()),
  fieldGoalsMade: v.optional(v.number()),
  fieldGoalsAttempted: v.optional(v.number()),
  threePointersMade: v.optional(v.number()),
  threePointersAttempted: v.optional(v.number()),
  freeThrowsMade: v.optional(v.number()),
  freeThrowsAttempted: v.optional(v.number()),
  offensiveRebounds: v.optional(v.number()),
  defensiveRebounds: v.optional(v.number()),
  assists: v.optional(v.number()),
  steals: v.optional(v.number()),
  blocks: v.optional(v.number()),
  turnovers: v.optional(v.number()),
  personalFouls: v.optional(v.number()),
  plusMinus: v.optional(v.number()),
});

/**
 * Submit team stats for a game.
 * Called by a team's staff after the game starts.
 */
export const submitTeamStats = mutation({
  args: {
    gameId: v.id("games"),
    clubId: v.id("clubs"),
    playerStats: v.array(playerStatInput),
    teamScore: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    // Verify the club is part of this game
    const isHomeTeam = game.homeClubId === args.clubId;
    const isAwayTeam = game.awayClubId === args.clubId;
    if (!isHomeTeam && !isAwayTeam) {
      throw new Error("Club is not part of this game");
    }

    // Check if user has permission (is staff of the club)
    const staffMember = await ctx.db
      .query("staff")
      .withIndex("byClub", (q) => q.eq("clubId", args.clubId))
      .filter((q) => q.eq(q.field("userId"), user._id))
      .first();

    if (!staffMember && !user.isSuperAdmin) {
      throw new Error("You must be staff of this team to submit stats");
    }

    // Check game status - must be scheduled or awaiting_stats
    if (game.status !== "scheduled" && game.status !== "awaiting_stats") {
      throw new Error(
        "Stats can only be submitted when game is scheduled or awaiting stats",
      );
    }

    // Check if game time has passed (allow submission)
    const gameDateTime = new Date(`${game.date}T${game.startTime}`);
    if (new Date() < gameDateTime) {
      throw new Error("Cannot submit stats before game start time");
    }

    // Check if this team already submitted
    if (isHomeTeam && game.homeStatsSubmittedAt) {
      throw new Error("Home team stats already submitted");
    }
    if (isAwayTeam && game.awayStatsSubmittedAt) {
      throw new Error("Away team stats already submitted");
    }

    // Verify all players belong to this club
    for (const stat of args.playerStats) {
      const player = await ctx.db.get(stat.playerId);
      if (!player || player.clubId !== args.clubId) {
        throw new Error(`Player ${stat.playerId} does not belong to this club`);
      }
    }

    // Delete any existing stats for this team in this game (shouldn't happen but safety)
    const existingStats = await ctx.db
      .query("gamePlayerStats")
      .withIndex("byGameAndClub", (q) =>
        q.eq("gameId", args.gameId).eq("clubId", args.clubId),
      )
      .collect();
    for (const stat of existingStats) {
      await ctx.db.delete(stat._id);
    }

    // Insert player stats
    for (const stat of args.playerStats) {
      await ctx.db.insert("gamePlayerStats", {
        gameId: args.gameId,
        playerId: stat.playerId,
        clubId: args.clubId,
        isStarter: stat.isStarter,
        minutes: stat.minutes,
        points: stat.points,
        fieldGoalsMade: stat.fieldGoalsMade,
        fieldGoalsAttempted: stat.fieldGoalsAttempted,
        threePointersMade: stat.threePointersMade,
        threePointersAttempted: stat.threePointersAttempted,
        freeThrowsMade: stat.freeThrowsMade,
        freeThrowsAttempted: stat.freeThrowsAttempted,
        offensiveRebounds: stat.offensiveRebounds,
        defensiveRebounds: stat.defensiveRebounds,
        assists: stat.assists,
        steals: stat.steals,
        blocks: stat.blocks,
        turnovers: stat.turnovers,
        personalFouls: stat.personalFouls,
        plusMinus: stat.plusMinus,
      });
    }

    // Update game with submission timestamp and score
    const now = Date.now();
    const updates: Record<string, unknown> = {};

    if (isHomeTeam) {
      updates.homeStatsSubmittedAt = now;
      updates.homeScore = args.teamScore;
    } else {
      updates.awayStatsSubmittedAt = now;
      updates.awayScore = args.teamScore;
    }

    // Update status based on submissions
    const homeSubmitted = isHomeTeam ? true : !!game.homeStatsSubmittedAt;
    const awaySubmitted = isAwayTeam ? true : !!game.awayStatsSubmittedAt;

    if (homeSubmitted && awaySubmitted) {
      updates.status = "pending_review";
    } else {
      updates.status = "awaiting_stats";
    }

    await ctx.db.patch(args.gameId, updates);

    return null;
  },
});

/**
 * Confirm the opponent's stats.
 * Called after reviewing the other team's submitted stats.
 */
export const confirmOpponentStats = mutation({
  args: {
    gameId: v.id("games"),
    clubId: v.id("clubs"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    // Verify the club is part of this game
    const isHomeTeam = game.homeClubId === args.clubId;
    const isAwayTeam = game.awayClubId === args.clubId;
    if (!isHomeTeam && !isAwayTeam) {
      throw new Error("Club is not part of this game");
    }

    // Check if user has permission
    const staffMember = await ctx.db
      .query("staff")
      .withIndex("byClub", (q) => q.eq("clubId", args.clubId))
      .filter((q) => q.eq(q.field("userId"), user._id))
      .first();

    if (!staffMember && !user.isSuperAdmin) {
      throw new Error("You must be staff of this team to confirm stats");
    }

    // Must be in pending_review status
    if (game.status !== "pending_review") {
      throw new Error("Game must be in pending review status to confirm stats");
    }

    // Update confirmation
    const updates: Record<string, unknown> = {};

    if (isHomeTeam) {
      updates.homeStatsConfirmed = true;
    } else {
      updates.awayStatsConfirmed = true;
    }

    // Check if both teams have confirmed
    const homeConfirmed = isHomeTeam ? true : !!game.homeStatsConfirmed;
    const awayConfirmed = isAwayTeam ? true : !!game.awayStatsConfirmed;

    if (homeConfirmed && awayConfirmed) {
      updates.status = "completed";
    }

    await ctx.db.patch(args.gameId, updates);

    return null;
  },
});

/**
 * Force complete a game (admin only).
 */
export const forceComplete = mutation({
  args: {
    gameId: v.id("games"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    await requireGameAdminAccess(ctx, game.organizationId);

    await ctx.db.patch(args.gameId, {
      status: "completed",
      homeStatsConfirmed: true,
      awayStatsConfirmed: true,
    });

    return null;
  },
});
