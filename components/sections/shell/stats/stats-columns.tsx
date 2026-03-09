"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Avatar } from "@/components/ui/avatar";
import { createSearchColumn } from "@/components/table/column-helpers";
import { Button } from "@/components/ui/button";
import type { FilterConfig } from "@/lib/table/types";
import { cn } from "@/lib/utils";

type Translator = (key: string) => string;

export const COMPACT_STATS_TABLE_CLASS =
  "[&_[data-slot=table]]:text-[11px] [&_[data-slot=table-head]]:h-8 [&_[data-slot=table-head]]:px-1.5 [&_[data-slot=table-head]]:text-[10px] [&_[data-slot=table-head]]:font-semibold [&_[data-slot=table-head]_*]:text-[10px] [&_[data-slot=table-cell]]:px-1.5 [&_[data-slot=table-cell]]:py-1.5 [&_[data-slot=table-cell]]:text-[11px] [&_[data-slot=table-cell]_*]:text-[11px] [&_[data-slot=table]_.lucide]:size-3 [&_[data-slot=table-row]>*:first-child]:sticky [&_[data-slot=table-row]>*:first-child]:left-0 [&_[data-slot=table-row]>*:first-child]:z-10 [&_[data-slot=table-row]>*:first-child]:bg-card [&_[data-slot=table-header]_[data-slot=table-row]>*:first-child]:z-20 [&_[data-slot=table-row]>*:first-child]:shadow-[1px_0_0_0_hsl(var(--border))]";

export interface SeasonPlayerStatsRow {
  playerId: string;
  playerName: string;
  photoUrl?: string;
  clubId: string;
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
}

export interface SeasonTeamStatsRow {
  clubId: string;
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
}

function formatNumber(value: number, digits = 1): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function NumericCell({
  value,
  digits = 1,
  suffix = "",
}: {
  value: number;
  digits?: number;
  suffix?: string;
}) {
  return (
    <span className="font-medium tabular-nums">
      {formatNumber(value, digits)}
      {suffix}
    </span>
  );
}

function buildClubFilterOptions(rows: Array<{ clubName: string }>) {
  return [...new Set(rows.map((row) => row.clubName))]
    .sort((a, b) => a.localeCompare(b))
    .map((clubName) => ({ value: clubName, label: clubName }));
}

export function createStatsSortableHeader(label: string) {
  return ({
    column,
  }: {
    column: {
      toggleSorting: (desc?: boolean) => void;
      getIsSorted: () => false | "asc" | "desc";
    };
  }) => {
    const sortDirection = column.getIsSorted();

    return (
      <Button
        variant="ghost"
        className={cn(
          "relative h-full w-full justify-start rounded-none px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground hover:bg-transparent",
          sortDirection && "bg-muted/70 text-foreground",
        )}
        onClick={() => column.toggleSorting(sortDirection === "asc")}
      >
        {label}
        <span
          className={cn(
            "pointer-events-none absolute left-0 right-0 h-0.5 bg-secondary opacity-0",
            sortDirection === "desc" && "top-0 opacity-100",
            sortDirection === "asc" && "bottom-0 opacity-100",
          )}
        />
      </Button>
    );
  };
}

export function createSeasonPlayerStatsColumns(
  t: Translator,
): ColumnDef<SeasonPlayerStatsRow>[] {
  return [
    createSearchColumn<SeasonPlayerStatsRow>([
      "playerName",
      "clubName",
      "clubNickname",
    ]),
    {
      accessorKey: "playerName",
      header: createStatsSortableHeader(t("games.statsTableColumns.player")),
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <Avatar
            src={row.original.photoUrl}
            initials={row.original.playerName.slice(0, 1).toUpperCase()}
            alt={row.original.playerName}
            className="size-6 bg-muted text-[10px] text-muted-foreground"
          />
          <span className="font-medium">{row.original.playerName}</span>
        </div>
      ),
    },
    {
      accessorKey: "clubName",
      header: createStatsSortableHeader(t("games.statsTableColumns.team")),
      cell: ({ row }) => {
        const shortName = row.original.clubNickname?.trim();
        return (
          <span className="text-muted-foreground">
            {shortName ? shortName.toUpperCase() : row.original.clubName}
          </span>
        );
      },
      filterFn: (row, id, value) => value.includes(row.getValue(id)),
    },
    {
      accessorKey: "gamesPlayed",
      header: createStatsSortableHeader(t("games.statsTableColumns.gp")),
      cell: ({ row }) => <NumericCell value={row.original.gamesPlayed} digits={0} />,
    },
    {
      accessorKey: "starts",
      header: createStatsSortableHeader(t("games.statsTableColumns.starts")),
      cell: ({ row }) => <NumericCell value={row.original.starts} digits={0} />,
    },
    {
      accessorKey: "goalsPerGame",
      header: createStatsSortableHeader(t("games.statsTableColumns.goalsPerGame")),
      cell: ({ row }) => <NumericCell value={row.original.goalsPerGame} />,
    },
    {
      accessorKey: "goals",
      header: createStatsSortableHeader(t("games.statsTableColumns.goals")),
      cell: ({ row }) => <NumericCell value={row.original.goals} digits={0} />,
    },
    {
      accessorKey: "yellowCards",
      header: createStatsSortableHeader(t("games.statsTableColumns.yellowCards")),
      cell: ({ row }) => <NumericCell value={row.original.yellowCards} digits={0} />,
    },
    {
      accessorKey: "redCards",
      header: createStatsSortableHeader(t("games.statsTableColumns.redCards")),
      cell: ({ row }) => <NumericCell value={row.original.redCards} digits={0} />,
    },
    {
      accessorKey: "penaltiesScored",
      header: createStatsSortableHeader(t("games.statsTableColumns.penalties")),
      cell: ({ row }) => <NumericCell value={row.original.penaltiesScored} digits={0} />,
    },
    {
      accessorKey: "penaltiesAttempted",
      header: createStatsSortableHeader(t("games.statsTableColumns.penaltiesAttempted")),
      cell: ({ row }) => <NumericCell value={row.original.penaltiesAttempted} digits={0} />,
    },
    {
      accessorKey: "penaltyConversionPct",
      header: createStatsSortableHeader(t("games.statsTableColumns.penaltyPct")),
      cell: ({ row }) => <NumericCell value={row.original.penaltyConversionPct} suffix="%" />,
    },
    {
      accessorKey: "substitutionsIn",
      header: createStatsSortableHeader(t("games.statsTableColumns.subIn")),
      cell: ({ row }) => <NumericCell value={row.original.substitutionsIn} digits={0} />,
    },
    {
      accessorKey: "substitutionsOut",
      header: createStatsSortableHeader(t("games.statsTableColumns.subOut")),
      cell: ({ row }) => <NumericCell value={row.original.substitutionsOut} digits={0} />,
    },
  ];
}

export function createSeasonTeamStatsColumns(
  t: Translator,
): ColumnDef<SeasonTeamStatsRow>[] {
  return [
    createSearchColumn<SeasonTeamStatsRow>(["clubName", "clubNickname"]),
    {
      accessorKey: "clubName",
      header: createStatsSortableHeader(t("games.statsTableColumns.team")),
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <Avatar
            src={row.original.clubLogoUrl}
            initials={row.original.clubName.slice(0, 1).toUpperCase()}
            alt={row.original.clubName}
            className="size-5 bg-muted text-[9px] text-muted-foreground"
          />
          <span className="font-medium">{row.original.clubName}</span>
        </div>
      ),
      filterFn: (row, id, value) => value.includes(row.getValue(id)),
    },
    {
      accessorKey: "gamesPlayed",
      header: createStatsSortableHeader(t("games.statsTableColumns.gp")),
      cell: ({ row }) => <NumericCell value={row.original.gamesPlayed} digits={0} />,
    },
    {
      accessorKey: "wins",
      header: createStatsSortableHeader(t("games.statsTableColumns.w")),
      cell: ({ row }) => <NumericCell value={row.original.wins} digits={0} />,
    },
    {
      accessorKey: "draws",
      header: createStatsSortableHeader(t("games.statsTableColumns.d")),
      cell: ({ row }) => <NumericCell value={row.original.draws} digits={0} />,
    },
    {
      accessorKey: "losses",
      header: createStatsSortableHeader(t("games.statsTableColumns.l")),
      cell: ({ row }) => <NumericCell value={row.original.losses} digits={0} />,
    },
    {
      accessorKey: "goalsFor",
      header: createStatsSortableHeader(t("games.statsTableColumns.gf")),
      cell: ({ row }) => <NumericCell value={row.original.goalsFor} digits={0} />,
    },
    {
      accessorKey: "goalsAgainst",
      header: createStatsSortableHeader(t("games.statsTableColumns.gc")),
      cell: ({ row }) => <NumericCell value={row.original.goalsAgainst} digits={0} />,
    },
    {
      accessorKey: "goalDifference",
      header: createStatsSortableHeader(t("games.statsTableColumns.diff")),
      cell: ({ row }) => <NumericCell value={row.original.goalDifference} digits={0} />,
    },
    {
      accessorKey: "points",
      header: createStatsSortableHeader(t("games.statsTableColumns.points")),
      cell: ({ row }) => <NumericCell value={row.original.points} digits={0} />,
    },
    {
      accessorKey: "cleanSheets",
      header: createStatsSortableHeader(t("games.statsTableColumns.cleanSheets")),
      cell: ({ row }) => <NumericCell value={row.original.cleanSheets} digits={0} />,
    },
    {
      accessorKey: "cornersPerGame",
      header: createStatsSortableHeader(t("games.statsTableColumns.cornersPerGame")),
      cell: ({ row }) => <NumericCell value={row.original.cornersPerGame} />,
    },
    {
      accessorKey: "freeKicksPerGame",
      header: createStatsSortableHeader(t("games.statsTableColumns.freeKicksPerGame")),
      cell: ({ row }) => <NumericCell value={row.original.freeKicksPerGame} />,
    },
    {
      accessorKey: "yellowCardsPerGame",
      header: createStatsSortableHeader(t("games.statsTableColumns.yellowCardsPerGame")),
      cell: ({ row }) => <NumericCell value={row.original.yellowCardsPerGame} />,
    },
    {
      accessorKey: "redCardsPerGame",
      header: createStatsSortableHeader(t("games.statsTableColumns.redCardsPerGame")),
      cell: ({ row }) => <NumericCell value={row.original.redCardsPerGame} />,
    },
    {
      accessorKey: "penaltiesScored",
      header: createStatsSortableHeader(t("games.statsTableColumns.penalties")),
      cell: ({ row }) => <NumericCell value={row.original.penaltiesScored} digits={0} />,
    },
    {
      accessorKey: "penaltiesAttempted",
      header: createStatsSortableHeader(t("games.statsTableColumns.penaltiesAttempted")),
      cell: ({ row }) => <NumericCell value={row.original.penaltiesAttempted} digits={0} />,
    },
    {
      accessorKey: "penaltyConversionPct",
      header: createStatsSortableHeader(t("games.statsTableColumns.penaltyPct")),
      cell: ({ row }) => <NumericCell value={row.original.penaltyConversionPct} suffix="%" />,
    },
    {
      accessorKey: "substitutionsPerGame",
      header: createStatsSortableHeader(t("games.statsTableColumns.subsPerGame")),
      cell: ({ row }) => <NumericCell value={row.original.substitutionsPerGame} />,
    },
  ];
}

export function createSeasonPlayerStatsFilterConfigs(
  t: Translator,
  rows: SeasonPlayerStatsRow[],
): FilterConfig[] {
  const clubOptions = buildClubFilterOptions(rows);
  if (clubOptions.length === 0) {
    return [];
  }

  return [
    {
      id: "clubName",
      label: t("games.statsTableColumns.team"),
      options: clubOptions,
    },
  ];
}
