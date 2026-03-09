export interface PlayerGameStats {
  _id: string;
  playerId: string;
  playerName: string;
  cometNumber?: string;
  isStarter: boolean;
  goals?: number;
  yellowCards?: number;
  redCards?: number;
  penaltiesAttempted?: number;
  penaltiesScored?: number;
  substitutionsIn?: number;
  substitutionsOut?: number;
}

export interface TeamGameTotals {
  goals: number;
  corners: number;
  freeKicks: number;
  yellowCards: number;
  redCards: number;
  penaltiesAttempted: number;
  penaltiesScored: number;
  substitutions: number;
}

export interface PlayerBoxScoreRow {
  id: string;
  name: string;
  cometNumber: string;
  goals: number;
  yellowCards: number;
  redCards: number;
  penaltiesAttempted: number;
  penaltiesScored: number;
  substitutionsIn: number;
  substitutionsOut: number;
}

export interface TransformedTeamStats {
  starters: PlayerBoxScoreRow[];
  bench: PlayerBoxScoreRow[];
  totals: TeamGameTotals;
}

export function didPlayerParticipate(stat: PlayerGameStats): boolean {
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

function mapPlayerToBoxScoreRow(stat: PlayerGameStats): PlayerBoxScoreRow {
  return {
    id: stat._id,
    name: stat.playerName,
    cometNumber: stat.cometNumber ?? "",
    goals: stat.goals ?? 0,
    yellowCards: stat.yellowCards ?? 0,
    redCards: stat.redCards ?? 0,
    penaltiesAttempted: stat.penaltiesAttempted ?? 0,
    penaltiesScored: stat.penaltiesScored ?? 0,
    substitutionsIn: stat.substitutionsIn ?? 0,
    substitutionsOut: stat.substitutionsOut ?? 0,
  };
}

export function calculateDerivedTotals(stats: PlayerGameStats[]) {
  return stats.reduce(
    (totals, stat) => {
      totals.yellowCards += stat.yellowCards ?? 0;
      totals.redCards += stat.redCards ?? 0;
      totals.penaltiesAttempted += stat.penaltiesAttempted ?? 0;
      totals.penaltiesScored += stat.penaltiesScored ?? 0;
      return totals;
    },
    {
      yellowCards: 0,
      redCards: 0,
      penaltiesAttempted: 0,
      penaltiesScored: 0,
    },
  );
}

export function calculateTeamTotals(
  stats: PlayerGameStats[],
  baseTotals?: Partial<TeamGameTotals>,
): TeamGameTotals {
  const derived = calculateDerivedTotals(stats);

  return {
    goals: baseTotals?.goals ?? 0,
    corners: baseTotals?.corners ?? 0,
    freeKicks: baseTotals?.freeKicks ?? 0,
    substitutions: baseTotals?.substitutions ?? 0,
    yellowCards: baseTotals?.yellowCards ?? derived.yellowCards,
    redCards: baseTotals?.redCards ?? derived.redCards,
    penaltiesAttempted:
      baseTotals?.penaltiesAttempted ?? derived.penaltiesAttempted,
    penaltiesScored: baseTotals?.penaltiesScored ?? derived.penaltiesScored,
  };
}

export function transformTeamStats(
  stats: PlayerGameStats[],
  baseTotals?: Partial<TeamGameTotals>,
): TransformedTeamStats {
  const participating = stats.filter(didPlayerParticipate);
  const starters = participating
    .filter((stat) => stat.isStarter)
    .map(mapPlayerToBoxScoreRow);
  const bench = participating
    .filter((stat) => !stat.isStarter)
    .map(mapPlayerToBoxScoreRow);

  return {
    starters,
    bench,
    totals: calculateTeamTotals(participating, baseTotals),
  };
}

export function formatPenaltySummary(scored: number, attempted: number): string {
  return attempted > 0 ? `${scored}/${attempted}` : "—";
}

export const emptyTeamTotals: TeamGameTotals = {
  goals: 0,
  corners: 0,
  freeKicks: 0,
  yellowCards: 0,
  redCards: 0,
  penaltiesAttempted: 0,
  penaltiesScored: 0,
  substitutions: 0,
};
