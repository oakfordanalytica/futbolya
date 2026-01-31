"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Text } from "@/components/ui/text";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface Team {
  name: string;
  logoUrl?: string;
}

interface PlayerStats {
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
  dnpReason?: string;
}

interface TeamTotals {
  points: number;
  fg: string;
  fgPct: string;
  threePt: string;
  threePtPct: string;
  ft: string;
  ftPct: string;
  rebounds: number;
  assists: number;
  turnovers: number;
  steals: number;
  blocks: number;
  offReb: number;
  defReb: number;
  fouls: number;
}

interface GameBoxScoreProps {
  game: {
    _id: string;
    homeTeamName: string;
    awayTeamName: string;
    homeTeamLogo?: string;
    awayTeamLogo?: string;
  };
}

const STAT_COLUMNS = [
  "min",
  "pts",
  "fg",
  "threePt",
  "ft",
  "reb",
  "ast",
  "to",
  "stl",
  "blk",
  "oreb",
  "dreb",
  "pf",
  "plusMinus",
] as const;

function TeamBoxScore({
  team,
  starters,
  bench,
  totals,
  t,
}: {
  team: Team;
  starters: PlayerStats[];
  bench: PlayerStats[];
  totals: TeamTotals;
  t: (key: string) => string;
}) {
  const primaryColor = "#6b7280";

  const renderPlayerRow = (player: PlayerStats) => {
    if (player.dnpReason) {
      return (
        <TableRow key={player.id}>
          <TableCell className="font-medium whitespace-nowrap sticky left-0 bg-background z-10">
            <div className="flex items-center gap-1">
              <span className="truncate max-w-[120px]">{player.name}</span>
              <span className="text-muted-foreground text-xs">
                #{player.jerseyNumber}
              </span>
            </div>
          </TableCell>
          <TableCell
            colSpan={STAT_COLUMNS.length}
            className="text-center text-muted-foreground text-xs"
          >
            {player.dnpReason}
          </TableCell>
        </TableRow>
      );
    }

    return (
      <TableRow key={player.id}>
        <TableCell className="font-medium whitespace-nowrap sticky left-0 bg-background z-10">
          <div className="flex items-center gap-1">
            <span className="truncate max-w-[120px]">{player.name}</span>
            <span className="text-muted-foreground text-xs">
              #{player.jerseyNumber}
            </span>
          </div>
        </TableCell>
        <TableCell className="text-center tabular-nums">
          {player.minutes}
        </TableCell>
        <TableCell className="text-center tabular-nums font-medium">
          {player.points}
        </TableCell>
        <TableCell className="text-center tabular-nums">{player.fg}</TableCell>
        <TableCell className="text-center tabular-nums">
          {player.threePt}
        </TableCell>
        <TableCell className="text-center tabular-nums">{player.ft}</TableCell>
        <TableCell className="text-center tabular-nums">
          {player.rebounds}
        </TableCell>
        <TableCell className="text-center tabular-nums">
          {player.assists}
        </TableCell>
        <TableCell className="text-center tabular-nums">
          {player.turnovers}
        </TableCell>
        <TableCell className="text-center tabular-nums">
          {player.steals}
        </TableCell>
        <TableCell className="text-center tabular-nums">
          {player.blocks}
        </TableCell>
        <TableCell className="text-center tabular-nums">
          {player.offReb}
        </TableCell>
        <TableCell className="text-center tabular-nums">
          {player.defReb}
        </TableCell>
        <TableCell className="text-center tabular-nums">
          {player.fouls}
        </TableCell>
        <TableCell className="text-center tabular-nums">
          {player.plusMinus > 0 ? `+${player.plusMinus}` : player.plusMinus}
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="rounded-md border overflow-hidden">
      <div
        className="flex items-center gap-3 border-b"
        style={{
          borderLeftWidth: "4px",
          borderLeftColor: primaryColor ?? "#6b7280",
        }}
      >
        {team.logoUrl ? (
          <Image
            src={team.logoUrl}
            alt={team.name}
            width={24}
            height={24}
            className="object-contain"
          />
        ) : (
          <div
            className="size-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ backgroundColor: primaryColor ?? "#6b7280" }}
          >
            {team.name.charAt(0)}
          </div>
        )}
        <Text className="font-semibold">{team.name}</Text>
      </div>

      <ScrollArea className="w-full">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="sticky left-0 bg-muted/50 z-10 min-w-[140px]">
                {t("games.boxScoreLabels.starters")}
              </TableHead>
              <TableHead className="text-center w-12">
                {t("games.boxScoreLabels.min")}
              </TableHead>
              <TableHead className="text-center w-12">
                {t("games.boxScoreLabels.pts")}
              </TableHead>
              <TableHead className="text-center w-14">
                {t("games.boxScoreLabels.fg")}
              </TableHead>
              <TableHead className="text-center w-14">
                {t("games.boxScoreLabels.threePt")}
              </TableHead>
              <TableHead className="text-center w-14">
                {t("games.boxScoreLabels.ft")}
              </TableHead>
              <TableHead className="text-center w-12">
                {t("games.boxScoreLabels.reb")}
              </TableHead>
              <TableHead className="text-center w-12">
                {t("games.boxScoreLabels.ast")}
              </TableHead>
              <TableHead className="text-center w-12">
                {t("games.boxScoreLabels.to")}
              </TableHead>
              <TableHead className="text-center w-12">
                {t("games.boxScoreLabels.stl")}
              </TableHead>
              <TableHead className="text-center w-12">
                {t("games.boxScoreLabels.blk")}
              </TableHead>
              <TableHead className="text-center w-12">
                {t("games.boxScoreLabels.oreb")}
              </TableHead>
              <TableHead className="text-center w-12">
                {t("games.boxScoreLabels.dreb")}
              </TableHead>
              <TableHead className="text-center w-12">
                {t("games.boxScoreLabels.pf")}
              </TableHead>
              <TableHead className="text-center w-12">
                {t("games.boxScoreLabels.plusMinus")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {starters.map(renderPlayerRow)}

            <TableRow className="bg-muted/30">
              <TableCell className="sticky left-0 bg-muted/30 z-10 font-semibold text-xs uppercase text-muted-foreground">
                {t("games.boxScoreLabels.bench")}
              </TableCell>
              <TableCell className="text-center text-xs text-muted-foreground">
                {t("games.boxScoreLabels.min")}
              </TableCell>
              <TableCell className="text-center text-xs text-muted-foreground">
                {t("games.boxScoreLabels.pts")}
              </TableCell>
              <TableCell className="text-center text-xs text-muted-foreground">
                {t("games.boxScoreLabels.fg")}
              </TableCell>
              <TableCell className="text-center text-xs text-muted-foreground">
                {t("games.boxScoreLabels.threePt")}
              </TableCell>
              <TableCell className="text-center text-xs text-muted-foreground">
                {t("games.boxScoreLabels.ft")}
              </TableCell>
              <TableCell className="text-center text-xs text-muted-foreground">
                {t("games.boxScoreLabels.reb")}
              </TableCell>
              <TableCell className="text-center text-xs text-muted-foreground">
                {t("games.boxScoreLabels.ast")}
              </TableCell>
              <TableCell className="text-center text-xs text-muted-foreground">
                {t("games.boxScoreLabels.to")}
              </TableCell>
              <TableCell className="text-center text-xs text-muted-foreground">
                {t("games.boxScoreLabels.stl")}
              </TableCell>
              <TableCell className="text-center text-xs text-muted-foreground">
                {t("games.boxScoreLabels.blk")}
              </TableCell>
              <TableCell className="text-center text-xs text-muted-foreground">
                {t("games.boxScoreLabels.oreb")}
              </TableCell>
              <TableCell className="text-center text-xs text-muted-foreground">
                {t("games.boxScoreLabels.dreb")}
              </TableCell>
              <TableCell className="text-center text-xs text-muted-foreground">
                {t("games.boxScoreLabels.pf")}
              </TableCell>
              <TableCell className="text-center text-xs text-muted-foreground">
                {t("games.boxScoreLabels.plusMinus")}
              </TableCell>
            </TableRow>

            {bench.map(renderPlayerRow)}

            <TableRow className="bg-muted/50 font-semibold">
              <TableCell className="sticky left-0 bg-muted/50 z-10 uppercase text-xs">
                {t("games.boxScoreLabels.team")}
              </TableCell>
              <TableCell className="text-center"></TableCell>
              <TableCell className="text-center tabular-nums">
                {totals.points}
              </TableCell>
              <TableCell className="text-center tabular-nums">
                {totals.fg}
              </TableCell>
              <TableCell className="text-center tabular-nums">
                {totals.threePt}
              </TableCell>
              <TableCell className="text-center tabular-nums">
                {totals.ft}
              </TableCell>
              <TableCell className="text-center tabular-nums">
                {totals.rebounds}
              </TableCell>
              <TableCell className="text-center tabular-nums">
                {totals.assists}
              </TableCell>
              <TableCell className="text-center tabular-nums">
                {totals.turnovers}
              </TableCell>
              <TableCell className="text-center tabular-nums">
                {totals.steals}
              </TableCell>
              <TableCell className="text-center tabular-nums">
                {totals.blocks}
              </TableCell>
              <TableCell className="text-center tabular-nums">
                {totals.offReb}
              </TableCell>
              <TableCell className="text-center tabular-nums">
                {totals.defReb}
              </TableCell>
              <TableCell className="text-center tabular-nums">
                {totals.fouls}
              </TableCell>
              <TableCell className="text-center"></TableCell>
            </TableRow>

            <TableRow className="text-muted-foreground text-xs">
              <TableCell className="sticky left-0 bg-background z-10"></TableCell>
              <TableCell className="text-center"></TableCell>
              <TableCell className="text-center"></TableCell>
              <TableCell className="text-center tabular-nums">
                {totals.fgPct}
              </TableCell>
              <TableCell className="text-center tabular-nums">
                {totals.threePtPct}
              </TableCell>
              <TableCell className="text-center tabular-nums">
                {totals.ftPct}
              </TableCell>
              <TableCell className="text-center"></TableCell>
              <TableCell className="text-center"></TableCell>
              <TableCell className="text-center"></TableCell>
              <TableCell className="text-center"></TableCell>
              <TableCell className="text-center"></TableCell>
              <TableCell className="text-center"></TableCell>
              <TableCell className="text-center"></TableCell>
              <TableCell className="text-center"></TableCell>
              <TableCell className="text-center"></TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}

export function GameBoxScore({ game }: GameBoxScoreProps) {
  const t = useTranslations("Common");

  // Placeholder data - will be replaced with actual game data
  const placeholderStarters: PlayerStats[] = [
    {
      id: "1",
      name: "Player 1",
      jerseyNumber: "1",
      minutes: 0,
      points: 0,
      fg: "0-0",
      threePt: "0-0",
      ft: "0-0",
      rebounds: 0,
      assists: 0,
      turnovers: 0,
      steals: 0,
      blocks: 0,
      offReb: 0,
      defReb: 0,
      fouls: 0,
      plusMinus: 0,
    },
  ];

  const placeholderBench: PlayerStats[] = [
    {
      id: "6",
      name: "Player 6",
      jerseyNumber: "6",
      minutes: 0,
      points: 0,
      fg: "0-0",
      threePt: "0-0",
      ft: "0-0",
      rebounds: 0,
      assists: 0,
      turnovers: 0,
      steals: 0,
      blocks: 0,
      offReb: 0,
      defReb: 0,
      fouls: 0,
      plusMinus: 0,
    },
  ];

  const placeholderTotals: TeamTotals = {
    points: 0,
    fg: "0-0",
    fgPct: "0%",
    threePt: "0-0",
    threePtPct: "0%",
    ft: "0-0",
    ftPct: "0%",
    rebounds: 0,
    assists: 0,
    turnovers: 0,
    steals: 0,
    blocks: 0,
    offReb: 0,
    defReb: 0,
    fouls: 0,
  };

  const homeTeam: Team = {
    name: game.homeTeamName,
    logoUrl: game.homeTeamLogo,
  };

  const awayTeam: Team = {
    name: game.awayTeamName,
    logoUrl: game.awayTeamLogo,
  };

  return (
    <div className="pt-3 space-y-6">
      <TeamBoxScore
        team={homeTeam}
        starters={placeholderStarters}
        bench={placeholderBench}
        totals={placeholderTotals}
        t={t}
      />

      <TeamBoxScore
        team={awayTeam}
        starters={placeholderStarters}
        bench={placeholderBench}
        totals={placeholderTotals}
        t={t}
      />

      <p className="text-center text-xs text-muted-foreground">
        {t("games.boxScoreNote")}
      </p>
    </div>
  );
}
