import { v } from "convex/values";
import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { getCurrentUser } from "./lib/auth";
import {
  hasClubStaffAccess,
  hasOrgAdminAccess,
  requireClubAccessBySlug,
  requireOrgAccess,
  requireOrgAdmin,
} from "./lib/permissions";
import { buildPlayerFullName } from "@/lib/players/name";

type PermissionCtx = QueryCtx | MutationCtx;

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
  gender,
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
  gameType,
  homeTeamId: v.string(),
  homeTeamName: v.string(),
  homeTeamLogo: v.optional(v.string()),
  awayTeamId: v.string(),
  awayTeamName: v.string(),
  awayTeamLogo: v.optional(v.string()),
  date: v.string(),
  startTime: v.string(),
  category: v.string(),
  gender,
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

const teamStatsInput = v.object({
  corners: v.optional(v.number()),
  freeKicks: v.optional(v.number()),
  substitutions: v.optional(v.number()),
});

const playerStatInput = v.object({
  playerId: v.id("players"),
  isStarter: v.boolean(),
  goals: v.optional(v.number()),
  yellowCards: v.optional(v.number()),
  redCards: v.optional(v.number()),
  penaltiesAttempted: v.optional(v.number()),
  penaltiesScored: v.optional(v.number()),
  substitutionsIn: v.optional(v.number()),
  substitutionsOut: v.optional(v.number()),
});

const playerStatsValidator = v.object({
  _id: v.id("gamePlayerStats"),
  playerId: v.id("players"),
  playerName: v.string(),
  jerseyNumber: v.optional(v.number()),
  cometNumber: v.optional(v.string()),
  photoUrl: v.optional(v.string()),
  clubId: v.id("clubs"),
  isStarter: v.boolean(),
  goals: v.optional(v.number()),
  yellowCards: v.optional(v.number()),
  redCards: v.optional(v.number()),
  penaltiesAttempted: v.optional(v.number()),
  penaltiesScored: v.optional(v.number()),
  substitutionsIn: v.optional(v.number()),
  substitutionsOut: v.optional(v.number()),
});

const teamStatsValidator = v.object({
  clubId: v.id("clubs"),
  goals: v.number(),
  corners: v.number(),
  freeKicks: v.number(),
  yellowCards: v.number(),
  redCards: v.number(),
  penaltiesAttempted: v.number(),
  penaltiesScored: v.number(),
  substitutions: v.number(),
});

const seasonPlayerLeaderValidator = v.object({
  playerId: v.id("players"),
  playerName: v.string(),
  photoUrl: v.optional(v.string()),
  clubId: v.id("clubs"),
  clubName: v.string(),
  gamesPlayed: v.number(),
  goals: v.number(),
  goalsPerGame: v.number(),
  yellowCards: v.number(),
  redCards: v.number(),
  penaltiesScored: v.number(),
});

const seasonTeamLeaderValidator = v.object({
  clubId: v.id("clubs"),
  clubName: v.string(),
  gamesPlayed: v.number(),
  wins: v.number(),
  draws: v.number(),
  losses: v.number(),
  points: v.number(),
  goalsFor: v.number(),
  goalsAgainst: v.number(),
  goalDifference: v.number(),
  cleanSheets: v.number(),
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
  goals: v.number(),
  goalsPerGame: v.number(),
  yellowCards: v.number(),
  yellowCardsPerGame: v.number(),
  redCards: v.number(),
  redCardsPerGame: v.number(),
  penaltiesAttempted: v.number(),
  penaltiesScored: v.number(),
  penaltyConversionPct: v.number(),
  substitutionsIn: v.number(),
  substitutionsOut: v.number(),
});

const seasonTeamStatsRowValidator = v.object({
  clubId: v.id("clubs"),
  clubName: v.string(),
  clubNickname: v.optional(v.string()),
  clubLogoUrl: v.optional(v.string()),
  gamesPlayed: v.number(),
  wins: v.number(),
  draws: v.number(),
  losses: v.number(),
  points: v.number(),
  goalsFor: v.number(),
  goalsAgainst: v.number(),
  goalDifference: v.number(),
  cleanSheets: v.number(),
  corners: v.number(),
  cornersPerGame: v.number(),
  freeKicks: v.number(),
  freeKicksPerGame: v.number(),
  yellowCards: v.number(),
  yellowCardsPerGame: v.number(),
  redCards: v.number(),
  redCardsPerGame: v.number(),
  penaltiesAttempted: v.number(),
  penaltiesScored: v.number(),
  penaltyConversionPct: v.number(),
  substitutions: v.number(),
  substitutionsPerGame: v.number(),
});

type SeasonPlayerLeader = {
  playerId: Id<"players">;
  playerName: string;
  photoUrl?: string;
  clubId: Id<"clubs">;
  clubName: string;
  gamesPlayed: number;
  goals: number;
  goalsPerGame: number;
  yellowCards: number;
  redCards: number;
  penaltiesScored: number;
};

type SeasonTeamLeader = {
  clubId: Id<"clubs">;
  clubName: string;
  gamesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  cleanSheets: number;
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
  goals: number;
  goalsPerGame: number;
  yellowCards: number;
  yellowCardsPerGame: number;
  redCards: number;
  redCardsPerGame: number;
  penaltiesAttempted: number;
  penaltiesScored: number;
  penaltyConversionPct: number;
  substitutionsIn: number;
  substitutionsOut: number;
};

type SeasonTeamStatsRow = {
  clubId: Id<"clubs">;
  clubName: string;
  clubNickname?: string;
  clubLogoUrl?: string;
  gamesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  cleanSheets: number;
  corners: number;
  cornersPerGame: number;
  freeKicks: number;
  freeKicksPerGame: number;
  yellowCards: number;
  yellowCardsPerGame: number;
  redCards: number;
  redCardsPerGame: number;
  penaltiesAttempted: number;
  penaltiesScored: number;
  penaltyConversionPct: number;
  substitutions: number;
  substitutionsPerGame: number;
};

type SeasonPlayerLeaders = {
  goals: Array<SeasonPlayerLeader>;
  goalsPerGame: Array<SeasonPlayerLeader>;
  yellowCards: Array<SeasonPlayerLeader>;
  redCards: Array<SeasonPlayerLeader>;
  penaltiesScored: Array<SeasonPlayerLeader>;
};

type SeasonTeamLeaders = {
  points: Array<SeasonTeamLeader>;
  goalsFor: Array<SeasonTeamLeader>;
  goalsAgainst: Array<SeasonTeamLeader>;
  goalDifference: Array<SeasonTeamLeader>;
  cleanSheets: Array<SeasonTeamLeader>;
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

type TeamStatsDoc = {
  _id: Id<"gameTeamStats">;
  gameId: Id<"games">;
  clubId: Id<"clubs">;
  corners?: number;
  freeKicks?: number;
  substitutions?: number;
};

type GameDoc = {
  _id: Id<"games">;
  organizationId: Id<"organizations">;
  homeClubId: Id<"clubs">;
  awayClubId: Id<"clubs">;
  homeScore?: number;
  awayScore?: number;
  status:
    | "scheduled"
    | "awaiting_stats"
    | "pending_review"
    | "completed"
    | "cancelled";
};

function roundToSingleDecimal(value: number): number {
  return Number(value.toFixed(1));
}

function calculatePercentage(partial: number, total: number): number {
  if (total <= 0) {
    return 0;
  }
  return roundToSingleDecimal((partial / total) * 100);
}

function topByMetric<T>(
  items: Array<T>,
  getValue: (item: T) => number,
  limit: number,
  direction: "desc" | "asc" = "desc",
): Array<T> {
  return [...items]
    .sort((a, b) => {
      const diff = getValue(a) - getValue(b);
      if (diff === 0) {
        return 0;
      }
      return direction === "desc" ? diff * -1 : diff;
    })
    .slice(0, limit);
}

function isIsoDateString(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function didPlayerParticipate(stat: {
  isStarter: boolean;
  goals?: number;
  yellowCards?: number;
  redCards?: number;
  penaltiesAttempted?: number;
  penaltiesScored?: number;
  substitutionsIn?: number;
  substitutionsOut?: number;
}): boolean {
  return (
    stat.isStarter ||
    (stat.goals ?? 0) > 0 ||
    (stat.yellowCards ?? 0) > 0 ||
    (stat.redCards ?? 0) > 0 ||
    (stat.penaltiesAttempted ?? 0) > 0 ||
    (stat.penaltiesScored ?? 0) > 0 ||
    (stat.substitutionsIn ?? 0) > 0 ||
    (stat.substitutionsOut ?? 0) > 0
  );
}

async function requireGameAccess(ctx: PermissionCtx, game: GameDoc) {
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
  const existingClubs = clubs.filter((club): club is NonNullable<typeof club> =>
    Boolean(club),
  );
  const clubMap = new Map(existingClubs.map((club) => [club._id, club]));

  const logoEntries = await Promise.all(
    existingClubs.map(async (club) => {
      const logoUrl = club.logoStorageId
        ? ((await ctx.storage.getUrl(club.logoStorageId)) ?? undefined)
        : undefined;
      return [club._id, logoUrl] as const;
    }),
  );

  return {
    clubMap,
    clubLogoMap: new Map(logoEntries),
  };
}

function ensureNonNegative(value: number | undefined, label: string) {
  if (value !== undefined && value < 0) {
    throw new Error(`${label} cannot be negative`);
  }
}

function buildTeamTotals(
  clubId: Id<"clubs">,
  game: GameDoc,
  playerStats: Array<{
    clubId: Id<"clubs">;
    yellowCards?: number;
    redCards?: number;
    penaltiesAttempted?: number;
    penaltiesScored?: number;
  }>,
  teamStats: TeamStatsDoc | null,
) {
  const teamPlayerStats = playerStats.filter((stat) => stat.clubId === clubId);
  const goals =
    game.homeClubId === clubId ? (game.homeScore ?? 0) : (game.awayScore ?? 0);

  return {
    clubId,
    goals,
    corners: teamStats?.corners ?? 0,
    freeKicks: teamStats?.freeKicks ?? 0,
    yellowCards: teamPlayerStats.reduce(
      (sum, stat) => sum + (stat.yellowCards ?? 0),
      0,
    ),
    redCards: teamPlayerStats.reduce(
      (sum, stat) => sum + (stat.redCards ?? 0),
      0,
    ),
    penaltiesAttempted: teamPlayerStats.reduce(
      (sum, stat) => sum + (stat.penaltiesAttempted ?? 0),
      0,
    ),
    penaltiesScored: teamPlayerStats.reduce(
      (sum, stat) => sum + (stat.penaltiesScored ?? 0),
      0,
    ),
    substitutions: teamStats?.substitutions ?? 0,
  };
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
    goals: number;
    yellowCards: number;
    redCards: number;
    penaltiesAttempted: number;
    penaltiesScored: number;
    substitutionsIn: number;
    substitutionsOut: number;
  };

  type TeamSeasonAggregate = {
    clubId: Id<"clubs">;
    gamesPlayed: number;
    wins: number;
    draws: number;
    losses: number;
    points: number;
    goalsFor: number;
    goalsAgainst: number;
    cleanSheets: number;
    corners: number;
    freeKicks: number;
    yellowCards: number;
    redCards: number;
    penaltiesAttempted: number;
    penaltiesScored: number;
    substitutions: number;
  };

  const playerAggregates = new Map<Id<"players">, PlayerSeasonAggregate>();
  const teamAggregates = new Map<Id<"clubs">, TeamSeasonAggregate>();

  const getOrCreateTeamAggregate = (clubId: Id<"clubs">) => {
    const existing = teamAggregates.get(clubId);
    if (existing) {
      return existing;
    }

    const created: TeamSeasonAggregate = {
      clubId,
      gamesPlayed: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      points: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      cleanSheets: 0,
      corners: 0,
      freeKicks: 0,
      yellowCards: 0,
      redCards: 0,
      penaltiesAttempted: 0,
      penaltiesScored: 0,
      substitutions: 0,
    };
    teamAggregates.set(clubId, created);
    return created;
  };

  const allGamePlayerStats = await Promise.all(
    completedGames.map((game) =>
      ctx.db
        .query("gamePlayerStats")
        .withIndex("byGame", (q) => q.eq("gameId", game._id))
        .collect(),
    ),
  );
  const allGameTeamStats = await Promise.all(
    completedGames.map((game) =>
      ctx.db
        .query("gameTeamStats")
        .withIndex("byGame", (q) => q.eq("gameId", game._id))
        .collect(),
    ),
  );

  for (let index = 0; index < completedGames.length; index += 1) {
    const game = completedGames[index];
    const gamePlayerStats = allGamePlayerStats[index];
    const gameTeamStats = allGameTeamStats[index];
    const homeScore = game.homeScore ?? 0;
    const awayScore = game.awayScore ?? 0;

    const homeAggregate = getOrCreateTeamAggregate(game.homeClubId);
    const awayAggregate = getOrCreateTeamAggregate(game.awayClubId);

    homeAggregate.gamesPlayed += 1;
    awayAggregate.gamesPlayed += 1;
    homeAggregate.goalsFor += homeScore;
    homeAggregate.goalsAgainst += awayScore;
    awayAggregate.goalsFor += awayScore;
    awayAggregate.goalsAgainst += homeScore;

    if (awayScore === 0) {
      homeAggregate.cleanSheets += 1;
    }
    if (homeScore === 0) {
      awayAggregate.cleanSheets += 1;
    }

    if (homeScore > awayScore) {
      homeAggregate.wins += 1;
      homeAggregate.points += 3;
      awayAggregate.losses += 1;
    } else if (awayScore > homeScore) {
      awayAggregate.wins += 1;
      awayAggregate.points += 3;
      homeAggregate.losses += 1;
    } else {
      homeAggregate.draws += 1;
      awayAggregate.draws += 1;
      homeAggregate.points += 1;
      awayAggregate.points += 1;
    }

    const teamStatsByClub = new Map(
      gameTeamStats.map((stat) => [stat.clubId, stat]),
    );
    const homeTotals = buildTeamTotals(
      game.homeClubId,
      game,
      gamePlayerStats,
      teamStatsByClub.get(game.homeClubId) ?? null,
    );
    const awayTotals = buildTeamTotals(
      game.awayClubId,
      game,
      gamePlayerStats,
      teamStatsByClub.get(game.awayClubId) ?? null,
    );

    homeAggregate.corners += homeTotals.corners;
    homeAggregate.freeKicks += homeTotals.freeKicks;
    homeAggregate.yellowCards += homeTotals.yellowCards;
    homeAggregate.redCards += homeTotals.redCards;
    homeAggregate.penaltiesAttempted += homeTotals.penaltiesAttempted;
    homeAggregate.penaltiesScored += homeTotals.penaltiesScored;
    homeAggregate.substitutions += homeTotals.substitutions;

    awayAggregate.corners += awayTotals.corners;
    awayAggregate.freeKicks += awayTotals.freeKicks;
    awayAggregate.yellowCards += awayTotals.yellowCards;
    awayAggregate.redCards += awayTotals.redCards;
    awayAggregate.penaltiesAttempted += awayTotals.penaltiesAttempted;
    awayAggregate.penaltiesScored += awayTotals.penaltiesScored;
    awayAggregate.substitutions += awayTotals.substitutions;

    for (const stat of gamePlayerStats) {
      if (!didPlayerParticipate(stat)) {
        continue;
      }

      const aggregate = playerAggregates.get(stat.playerId);
      if (aggregate) {
        aggregate.gamesPlayed += 1;
        aggregate.starts += stat.isStarter ? 1 : 0;
        aggregate.goals += stat.goals ?? 0;
        aggregate.yellowCards += stat.yellowCards ?? 0;
        aggregate.redCards += stat.redCards ?? 0;
        aggregate.penaltiesAttempted += stat.penaltiesAttempted ?? 0;
        aggregate.penaltiesScored += stat.penaltiesScored ?? 0;
        aggregate.substitutionsIn += stat.substitutionsIn ?? 0;
        aggregate.substitutionsOut += stat.substitutionsOut ?? 0;
      } else {
        playerAggregates.set(stat.playerId, {
          playerId: stat.playerId,
          clubId: stat.clubId,
          gamesPlayed: 1,
          starts: stat.isStarter ? 1 : 0,
          goals: stat.goals ?? 0,
          yellowCards: stat.yellowCards ?? 0,
          redCards: stat.redCards ?? 0,
          penaltiesAttempted: stat.penaltiesAttempted ?? 0,
          penaltiesScored: stat.penaltiesScored ?? 0,
          substitutionsIn: stat.substitutionsIn ?? 0,
          substitutionsOut: stat.substitutionsOut ?? 0,
        });
      }
    }
  }

  const clubIds = new Set<Id<"clubs">>();
  for (const clubId of teamAggregates.keys()) {
    clubIds.add(clubId);
  }
  for (const aggregate of playerAggregates.values()) {
    clubIds.add(aggregate.clubId);
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

  const playerDocs = await Promise.all(
    Array.from(playerAggregates.keys()).map((playerId) => ctx.db.get(playerId)),
  );
  const players = playerDocs.filter(
    (player): player is NonNullable<typeof player> => Boolean(player),
  );
  const playerById = new Map(players.map((player) => [player._id, player]));
  const playerPhotoById = new Map<Id<"players">, string>();

  await Promise.all(
    players.map(async (player) => {
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
          ? buildPlayerFullName(
              player.firstName,
              player.lastName,
              player.secondLastName,
            )
          : "Unknown",
        photoUrl: playerPhotoById.get(aggregate.playerId),
        clubId: aggregate.clubId,
        clubName: clubNameById.get(aggregate.clubId) ?? "Unknown",
        clubNickname: clubNicknameById.get(aggregate.clubId),
        gamesPlayed,
        starts: aggregate.starts,
        goals: aggregate.goals,
        goalsPerGame: roundToSingleDecimal(aggregate.goals / gamesPlayed),
        yellowCards: aggregate.yellowCards,
        yellowCardsPerGame: roundToSingleDecimal(
          aggregate.yellowCards / gamesPlayed,
        ),
        redCards: aggregate.redCards,
        redCardsPerGame: roundToSingleDecimal(aggregate.redCards / gamesPlayed),
        penaltiesAttempted: aggregate.penaltiesAttempted,
        penaltiesScored: aggregate.penaltiesScored,
        penaltyConversionPct: calculatePercentage(
          aggregate.penaltiesScored,
          aggregate.penaltiesAttempted,
        ),
        substitutionsIn: aggregate.substitutionsIn,
        substitutionsOut: aggregate.substitutionsOut,
      };
    })
    .sort((a, b) => {
      if (b.goals !== a.goals) {
        return b.goals - a.goals;
      }
      if (b.goalsPerGame !== a.goalsPerGame) {
        return b.goalsPerGame - a.goalsPerGame;
      }
      return b.gamesPlayed - a.gamesPlayed;
    });

  const teamRows = Array.from(teamAggregates.values())
    .filter((aggregate) => aggregate.gamesPlayed > 0)
    .map((aggregate) => ({
      clubId: aggregate.clubId,
      clubName: clubNameById.get(aggregate.clubId) ?? "Unknown",
      clubNickname: clubNicknameById.get(aggregate.clubId),
      clubLogoUrl: clubLogoById.get(aggregate.clubId),
      gamesPlayed: aggregate.gamesPlayed,
      wins: aggregate.wins,
      draws: aggregate.draws,
      losses: aggregate.losses,
      points: aggregate.points,
      goalsFor: aggregate.goalsFor,
      goalsAgainst: aggregate.goalsAgainst,
      goalDifference: aggregate.goalsFor - aggregate.goalsAgainst,
      cleanSheets: aggregate.cleanSheets,
      corners: aggregate.corners,
      cornersPerGame: roundToSingleDecimal(
        aggregate.corners / aggregate.gamesPlayed,
      ),
      freeKicks: aggregate.freeKicks,
      freeKicksPerGame: roundToSingleDecimal(
        aggregate.freeKicks / aggregate.gamesPlayed,
      ),
      yellowCards: aggregate.yellowCards,
      yellowCardsPerGame: roundToSingleDecimal(
        aggregate.yellowCards / aggregate.gamesPlayed,
      ),
      redCards: aggregate.redCards,
      redCardsPerGame: roundToSingleDecimal(
        aggregate.redCards / aggregate.gamesPlayed,
      ),
      penaltiesAttempted: aggregate.penaltiesAttempted,
      penaltiesScored: aggregate.penaltiesScored,
      penaltyConversionPct: calculatePercentage(
        aggregate.penaltiesScored,
        aggregate.penaltiesAttempted,
      ),
      substitutions: aggregate.substitutions,
      substitutionsPerGame: roundToSingleDecimal(
        aggregate.substitutions / aggregate.gamesPlayed,
      ),
    }))
    .sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      if (b.goalDifference !== a.goalDifference) {
        return b.goalDifference - a.goalDifference;
      }
      if (b.goalsFor !== a.goalsFor) {
        return b.goalsFor - a.goalsFor;
      }
      return a.clubName.localeCompare(b.clubName);
    });

  return {
    season,
    gamesCount: completedGames.length,
    playerRows,
    teamRows,
  };
}

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
        status: game.status,
        homeScore: game.homeScore,
        awayScore: game.awayScore,
      };
    });
  },
});

export const listByClubSlug = query({
  args: { clubSlug: v.string() },
  returns: v.array(gameListItemValidator),
  handler: async (ctx, args) => {
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
        status: game.status,
        homeScore: game.homeScore,
        awayScore: game.awayScore,
      };
    });
  },
});

export const getGamePlayerStats = query({
  args: { gameId: v.id("games") },
  returns: v.object({
    homeStats: v.array(playerStatsValidator),
    awayStats: v.array(playerStatsValidator),
    homeTeamStats: teamStatsValidator,
    awayTeamStats: teamStatsValidator,
  }),
  handler: async (ctx, args) => {
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

    const [allPlayerStats, teamStatsRows] = await Promise.all([
      ctx.db
        .query("gamePlayerStats")
        .withIndex("byGame", (q) => q.eq("gameId", args.gameId))
        .collect(),
      ctx.db
        .query("gameTeamStats")
        .withIndex("byGame", (q) => q.eq("gameId", args.gameId))
        .collect(),
    ]);

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
          substitutionsIn: stat.substitutionsIn,
          substitutionsOut: stat.substitutionsOut,
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
  },
});

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
      goals: v.array(seasonPlayerLeaderValidator),
      goalsPerGame: v.array(seasonPlayerLeaderValidator),
      yellowCards: v.array(seasonPlayerLeaderValidator),
      redCards: v.array(seasonPlayerLeaderValidator),
      penaltiesScored: v.array(seasonPlayerLeaderValidator),
    }),
    teamLeaders: v.object({
      points: v.array(seasonTeamLeaderValidator),
      goalsFor: v.array(seasonTeamLeaderValidator),
      goalsAgainst: v.array(seasonTeamLeaderValidator),
      goalDifference: v.array(seasonTeamLeaderValidator),
      cleanSheets: v.array(seasonTeamLeaderValidator),
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
  },
});

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

export const getById = query({
  args: { gameId: v.id("games") },
  returns: v.union(gameValidator, v.null()),
  handler: async (ctx, args) => {
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

export const create = mutation({
  args: {
    orgSlug: v.string(),
    seasonId: v.optional(v.string()),
    homeClubId: v.id("clubs"),
    awayClubId: v.id("clubs"),
    date: v.string(),
    startTime: v.string(),
    category: v.string(),
    gender,
    locationName: v.optional(v.string()),
    locationCoordinates: v.optional(v.array(v.number())),
  },
  returns: v.id("games"),
  handler: async (ctx, args) => {
    const { organization } = await requireOrgAdmin(ctx, args.orgSlug);

    const [homeClub, awayClub] = await Promise.all([
      ctx.db.get(args.homeClubId),
      ctx.db.get(args.awayClubId),
    ]);

    if (!homeClub || homeClub.organizationId !== organization._id) {
      throw new Error("Home club not found or doesn't belong to this league");
    }
    if (!awayClub || awayClub.organizationId !== organization._id) {
      throw new Error("Away club not found or doesn't belong to this league");
    }
    if (homeClub.status !== "affiliated" || awayClub.status !== "affiliated") {
      throw new Error("Only affiliated teams can be scheduled for games");
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

export const remove = mutation({
  args: { gameId: v.id("games") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    await requireGameAdminAccess(ctx, game.organizationId);

    const [events, playerStats, teamStats, lineups] = await Promise.all([
      ctx.db
        .query("gameEvents")
        .withIndex("byGame", (q) => q.eq("gameId", args.gameId))
        .collect(),
      ctx.db
        .query("gamePlayerStats")
        .withIndex("byGame", (q) => q.eq("gameId", args.gameId))
        .collect(),
      ctx.db
        .query("gameTeamStats")
        .withIndex("byGame", (q) => q.eq("gameId", args.gameId))
        .collect(),
      ctx.db
        .query("gameLineups")
        .withIndex("byGame", (q) => q.eq("gameId", args.gameId))
        .collect(),
    ]);

    for (const event of events) {
      await ctx.db.delete(event._id);
    }
    for (const stat of playerStats) {
      await ctx.db.delete(stat._id);
    }
    for (const stat of teamStats) {
      await ctx.db.delete(stat._id);
    }
    for (const lineup of lineups) {
      await ctx.db.delete(lineup._id);
    }

    await ctx.db.delete(args.gameId);
    return null;
  },
});

export const submitTeamStats = mutation({
  args: {
    gameId: v.id("games"),
    clubId: v.id("clubs"),
    teamStats: teamStatsInput,
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

    const isHomeTeam = game.homeClubId === args.clubId;
    const isAwayTeam = game.awayClubId === args.clubId;
    if (!isHomeTeam && !isAwayTeam) {
      throw new Error("Club is not part of this game");
    }

    const staffMember = await ctx.db
      .query("staff")
      .withIndex("byClub", (q) => q.eq("clubId", args.clubId))
      .filter((q) => q.eq(q.field("userId"), user._id))
      .first();
    if (!staffMember && !user.isSuperAdmin) {
      throw new Error("You must be staff of this team to submit stats");
    }

    if (game.status !== "scheduled" && game.status !== "awaiting_stats") {
      throw new Error(
        "Stats can only be submitted when game is scheduled or awaiting stats",
      );
    }

    const gameDateTime = new Date(`${game.date}T${game.startTime}`);
    if (new Date() < gameDateTime) {
      throw new Error("Cannot submit stats before game start time");
    }

    if (isHomeTeam && game.homeStatsSubmittedAt) {
      throw new Error("Home team stats already submitted");
    }
    if (isAwayTeam && game.awayStatsSubmittedAt) {
      throw new Error("Away team stats already submitted");
    }

    ensureNonNegative(args.teamScore, "Team score");
    ensureNonNegative(args.teamStats.corners, "Corners");
    ensureNonNegative(args.teamStats.freeKicks, "Free kicks");
    ensureNonNegative(args.teamStats.substitutions, "Substitutions");

    for (const stat of args.playerStats) {
      const player = await ctx.db.get(stat.playerId);
      if (!player || player.clubId !== args.clubId) {
        throw new Error(`Player ${stat.playerId} does not belong to this club`);
      }

      ensureNonNegative(stat.goals, "Goals");
      ensureNonNegative(stat.yellowCards, "Yellow cards");
      ensureNonNegative(stat.redCards, "Red cards");
      ensureNonNegative(stat.penaltiesAttempted, "Penalties attempted");
      ensureNonNegative(stat.penaltiesScored, "Penalties scored");
      ensureNonNegative(stat.substitutionsIn, "Substitutions in");
      ensureNonNegative(stat.substitutionsOut, "Substitutions out");

      if ((stat.penaltiesScored ?? 0) > (stat.penaltiesAttempted ?? 0)) {
        throw new Error("Penalties scored cannot exceed penalties attempted");
      }
      if ((stat.penaltiesScored ?? 0) > (stat.goals ?? 0)) {
        throw new Error("Penalties scored cannot exceed goals");
      }
    }

    const [existingPlayerStats, existingTeamStats] = await Promise.all([
      ctx.db
        .query("gamePlayerStats")
        .withIndex("byGameAndClub", (q) =>
          q.eq("gameId", args.gameId).eq("clubId", args.clubId),
        )
        .collect(),
      ctx.db
        .query("gameTeamStats")
        .withIndex("byGameAndClub", (q) =>
          q.eq("gameId", args.gameId).eq("clubId", args.clubId),
        )
        .collect(),
    ]);

    for (const stat of existingPlayerStats) {
      await ctx.db.delete(stat._id);
    }
    for (const stat of existingTeamStats) {
      await ctx.db.delete(stat._id);
    }

    await ctx.db.insert("gameTeamStats", {
      gameId: args.gameId,
      clubId: args.clubId,
      corners: args.teamStats.corners,
      freeKicks: args.teamStats.freeKicks,
      substitutions: args.teamStats.substitutions,
    });

    for (const stat of args.playerStats) {
      await ctx.db.insert("gamePlayerStats", {
        gameId: args.gameId,
        playerId: stat.playerId,
        clubId: args.clubId,
        isStarter: stat.isStarter,
        goals: stat.goals,
        yellowCards: stat.yellowCards,
        redCards: stat.redCards,
        penaltiesAttempted: stat.penaltiesAttempted,
        penaltiesScored: stat.penaltiesScored,
        substitutionsIn: stat.substitutionsIn,
        substitutionsOut: stat.substitutionsOut,
      });
    }

    const now = Date.now();
    const updates: Record<string, unknown> = {};
    if (isHomeTeam) {
      updates.homeStatsSubmittedAt = now;
      updates.homeScore = args.teamScore;
    } else {
      updates.awayStatsSubmittedAt = now;
      updates.awayScore = args.teamScore;
    }

    const homeSubmitted = isHomeTeam ? true : !!game.homeStatsSubmittedAt;
    const awaySubmitted = isAwayTeam ? true : !!game.awayStatsSubmittedAt;
    updates.status =
      homeSubmitted && awaySubmitted ? "pending_review" : "awaiting_stats";

    await ctx.db.patch(args.gameId, updates);
    return null;
  },
});

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

    const isHomeTeam = game.homeClubId === args.clubId;
    const isAwayTeam = game.awayClubId === args.clubId;
    if (!isHomeTeam && !isAwayTeam) {
      throw new Error("Club is not part of this game");
    }

    const staffMember = await ctx.db
      .query("staff")
      .withIndex("byClub", (q) => q.eq("clubId", args.clubId))
      .filter((q) => q.eq(q.field("userId"), user._id))
      .first();
    if (!staffMember && !user.isSuperAdmin) {
      throw new Error("You must be staff of this team to confirm stats");
    }

    if (game.status !== "pending_review") {
      throw new Error("Game must be in pending review status to confirm stats");
    }

    const updates: Record<string, unknown> = {};
    if (isHomeTeam) {
      updates.homeStatsConfirmed = true;
    } else {
      updates.awayStatsConfirmed = true;
    }

    const homeConfirmed = isHomeTeam ? true : !!game.homeStatsConfirmed;
    const awayConfirmed = isAwayTeam ? true : !!game.awayStatsConfirmed;
    if (homeConfirmed && awayConfirmed) {
      updates.status = "completed";
    }

    await ctx.db.patch(args.gameId, updates);
    return null;
  },
});

export const forceComplete = mutation({
  args: { gameId: v.id("games") },
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
