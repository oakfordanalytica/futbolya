/**
 * Basketball game statistics calculation utilities.
 * Shared between GameBoxScore and GameStatsTable components.
 */

export interface PlayerGameStats {
  _id: string;
  playerName: string;
  jerseyNumber?: number;
  isStarter: boolean;
  minutes?: number;
  points?: number;
  fieldGoalsMade?: number;
  fieldGoalsAttempted?: number;
  threePointersMade?: number;
  threePointersAttempted?: number;
  freeThrowsMade?: number;
  freeThrowsAttempted?: number;
  offensiveRebounds?: number;
  defensiveRebounds?: number;
  assists?: number;
  steals?: number;
  blocks?: number;
  turnovers?: number;
  personalFouls?: number;
  plusMinus?: number;
}

export interface PlayerBoxScoreRow {
  id: string;
  name: string;
  jerseyNumber: string;
  minutes: number;
  points: number;
  fg: string;
  threePt: string;
  ft: string;
  rebounds: number;
  assists: number;
  turnovers: number;
  steals: number;
  blocks: number;
  offReb: number;
  defReb: number;
  fouls: number;
  plusMinus: number;
}

export interface TeamGameTotals {
  points: number;
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  fieldGoalPct: string;
  threePointersMade: number;
  threePointersAttempted: number;
  threePointPct: string;
  freeThrowsMade: number;
  freeThrowsAttempted: number;
  freeThrowPct: string;
  rebounds: number;
  offensiveRebounds: number;
  defensiveRebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  personalFouls: number;
  // Derived stats
  assistToTurnoverRatio: string;
}

export interface TransformedTeamStats {
  starters: PlayerBoxScoreRow[];
  bench: PlayerBoxScoreRow[];
  totals: TeamGameTotals;
}

/**
 * Calculate percentage from made/attempted.
 */
export function calculatePercentage(made: number, attempted: number): string {
  if (attempted === 0) return "0.0%";
  return `${((made / attempted) * 100).toFixed(1)}%`;
}

/**
 * Calculate assist to turnover ratio.
 */
export function calculateAstToRatio(assists: number, turnovers: number): string {
  if (turnovers === 0) return assists > 0 ? "∞" : "0.00";
  return (assists / turnovers).toFixed(2);
}

/**
 * Format made-attempted stat (e.g., "5-10").
 */
export function formatMadeAttempted(made: number, attempted: number): string {
  return `${made}-${attempted}`;
}

/**
 * Transform raw player stats into box score row format.
 */
function mapPlayerToBoxScoreRow(stat: PlayerGameStats): PlayerBoxScoreRow {
  return {
    id: stat._id,
    name: stat.playerName,
    jerseyNumber: stat.jerseyNumber?.toString() ?? "",
    minutes: stat.minutes ?? 0,
    points: stat.points ?? 0,
    fg: formatMadeAttempted(stat.fieldGoalsMade ?? 0, stat.fieldGoalsAttempted ?? 0),
    threePt: formatMadeAttempted(stat.threePointersMade ?? 0, stat.threePointersAttempted ?? 0),
    ft: formatMadeAttempted(stat.freeThrowsMade ?? 0, stat.freeThrowsAttempted ?? 0),
    rebounds: (stat.offensiveRebounds ?? 0) + (stat.defensiveRebounds ?? 0),
    assists: stat.assists ?? 0,
    turnovers: stat.turnovers ?? 0,
    steals: stat.steals ?? 0,
    blocks: stat.blocks ?? 0,
    offReb: stat.offensiveRebounds ?? 0,
    defReb: stat.defensiveRebounds ?? 0,
    fouls: stat.personalFouls ?? 0,
    plusMinus: stat.plusMinus ?? 0,
  };
}

/**
 * Calculate team totals from player stats.
 */
export function calculateTeamTotals(stats: PlayerGameStats[]): TeamGameTotals {
  const fgMade = stats.reduce((sum, s) => sum + (s.fieldGoalsMade ?? 0), 0);
  const fgAttempted = stats.reduce((sum, s) => sum + (s.fieldGoalsAttempted ?? 0), 0);
  const threeMade = stats.reduce((sum, s) => sum + (s.threePointersMade ?? 0), 0);
  const threeAttempted = stats.reduce((sum, s) => sum + (s.threePointersAttempted ?? 0), 0);
  const ftMade = stats.reduce((sum, s) => sum + (s.freeThrowsMade ?? 0), 0);
  const ftAttempted = stats.reduce((sum, s) => sum + (s.freeThrowsAttempted ?? 0), 0);
  const offReb = stats.reduce((sum, s) => sum + (s.offensiveRebounds ?? 0), 0);
  const defReb = stats.reduce((sum, s) => sum + (s.defensiveRebounds ?? 0), 0);
  const assists = stats.reduce((sum, s) => sum + (s.assists ?? 0), 0);
  const turnovers = stats.reduce((sum, s) => sum + (s.turnovers ?? 0), 0);

  return {
    points: stats.reduce((sum, s) => sum + (s.points ?? 0), 0),
    fieldGoalsMade: fgMade,
    fieldGoalsAttempted: fgAttempted,
    fieldGoalPct: calculatePercentage(fgMade, fgAttempted),
    threePointersMade: threeMade,
    threePointersAttempted: threeAttempted,
    threePointPct: calculatePercentage(threeMade, threeAttempted),
    freeThrowsMade: ftMade,
    freeThrowsAttempted: ftAttempted,
    freeThrowPct: calculatePercentage(ftMade, ftAttempted),
    rebounds: offReb + defReb,
    offensiveRebounds: offReb,
    defensiveRebounds: defReb,
    assists,
    steals: stats.reduce((sum, s) => sum + (s.steals ?? 0), 0),
    blocks: stats.reduce((sum, s) => sum + (s.blocks ?? 0), 0),
    turnovers,
    personalFouls: stats.reduce((sum, s) => sum + (s.personalFouls ?? 0), 0),
    assistToTurnoverRatio: calculateAstToRatio(assists, turnovers),
  };
}

/**
 * Transform raw player stats into structured team data for display.
 */
export function transformTeamStats(stats: PlayerGameStats[]): TransformedTeamStats {
  const starters = stats.filter((s) => s.isStarter).map(mapPlayerToBoxScoreRow);
  const bench = stats.filter((s) => !s.isStarter).map(mapPlayerToBoxScoreRow);
  const totals = calculateTeamTotals(stats);

  return { starters, bench, totals };
}

/**
 * Empty team totals for when no data is available.
 */
export const emptyTeamTotals: TeamGameTotals = {
  points: 0,
  fieldGoalsMade: 0,
  fieldGoalsAttempted: 0,
  fieldGoalPct: "0.0%",
  threePointersMade: 0,
  threePointersAttempted: 0,
  threePointPct: "0.0%",
  freeThrowsMade: 0,
  freeThrowsAttempted: 0,
  freeThrowPct: "0.0%",
  rebounds: 0,
  offensiveRebounds: 0,
  defensiveRebounds: 0,
  assists: 0,
  steals: 0,
  blocks: 0,
  turnovers: 0,
  personalFouls: 0,
  assistToTurnoverRatio: "0.00",
};
