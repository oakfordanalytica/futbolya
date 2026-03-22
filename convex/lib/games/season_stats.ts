import type { QueryCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import { buildPlayerFullName } from "@/lib/players/name";
import { didPlayerParticipate } from "@/lib/soccer/stats-domain";
import {
  buildTeamTotals,
  calculatePercentage,
  isOperationallyCompleted,
  roundToSingleDecimal,
} from "./utils";
import type { SeasonStatsAggregate } from "./validators";

export async function buildSeasonStatsAggregate(
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
      isOperationallyCompleted(game.status) &&
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
