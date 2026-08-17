"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
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
import {
  transformTeamStats,
  emptyTeamTotals,
  formatPenaltySummary,
  type PlayerBoxScoreRow,
  type PlayerGameStats,
  type TeamGameTotals,
} from "@/lib/soccer/game-stats";
import { cn } from "@/lib/utils";

interface Team {
  name: string;
  logoUrl?: string;
  primaryColor?: string;
}

interface GameBoxScoreProps {
  game: {
    _id: string;
    homeTeamName: string;
    awayTeamName: string;
    homeTeamLogo?: string;
    awayTeamLogo?: string;
    homeTeamColor?: string;
    awayTeamColor?: string;
  };
}

function TeamBoxScore({
  team,
  starters,
  bench,
  totals,
  t,
  className,
}: {
  team: Team;
  starters: PlayerBoxScoreRow[];
  bench: PlayerBoxScoreRow[];
  totals: TeamGameTotals;
  t: (key: string) => string;
  className?: string;
}) {
  const primaryColor = team.primaryColor?.trim() || "#6b7280";

  const renderPlayerRow = (player: PlayerBoxScoreRow) => {
    return (
      <TableRow key={player.id} className="text-[11px] sm:text-xs">
        <TableCell className="sticky left-0 z-10 bg-background py-2 font-medium whitespace-nowrap">
          <span className="truncate max-w-[140px]">{player.name}</span>
        </TableCell>
        <TableCell className="py-2 text-center tabular-nums font-medium">
          {player.goals}
        </TableCell>
        <TableCell className="py-2 text-center tabular-nums">
          {player.yellowCards}
        </TableCell>
        <TableCell className="py-2 text-center tabular-nums">
          {player.redCards}
        </TableCell>
        <TableCell className="py-2 text-center tabular-nums">
          {formatPenaltySummary(
            player.penaltiesScored,
            player.penaltiesAttempted,
          )}
        </TableCell>
        <TableCell className="py-2 text-center tabular-nums">
          {player.substitutionsIn}
        </TableCell>
        <TableCell className="py-2 text-center tabular-nums">
          {player.substitutionsOut}
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className={cn("overflow-hidden rounded-md border", className)}>
      <div
        className="flex items-center gap-3 border-b p-3"
        style={{
          borderLeftWidth: "4px",
          borderLeftColor: primaryColor,
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
            className="flex size-6 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: primaryColor }}
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
              <TableHead className="sticky left-0 z-10 min-w-40 bg-muted/50 py-2 text-[10px] sm:text-[11px]">
                {t("games.boxScoreLabels.starters")}
              </TableHead>
              <TableHead className="w-12 py-2 text-center text-[10px] sm:text-[11px]">
                {t("games.boxScoreLabels.goals")}
              </TableHead>
              <TableHead className="w-12 py-2 text-center text-[10px] sm:text-[11px]">
                {t("games.boxScoreLabels.yellowCards")}
              </TableHead>
              <TableHead className="w-12 py-2 text-center text-[10px] sm:text-[11px]">
                {t("games.boxScoreLabels.redCards")}
              </TableHead>
              <TableHead className="w-16 py-2 text-center text-[10px] sm:text-[11px]">
                {t("games.boxScoreLabels.penalties")}
              </TableHead>
              <TableHead className="w-16 py-2 text-center text-[10px] sm:text-[11px]">
                {t("games.boxScoreLabels.subIn")}
              </TableHead>
              <TableHead className="w-16 py-2 text-center text-[10px] sm:text-[11px]">
                {t("games.boxScoreLabels.subOut")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {starters.map(renderPlayerRow)}

            {bench.length > 0 ? (
              <>
                <TableRow className="bg-muted/30">
                  <TableCell className="sticky left-0 z-10 bg-muted/30 py-2 text-[10px] font-semibold uppercase text-muted-foreground sm:text-[11px]">
                    {t("games.boxScoreLabels.bench")}
                  </TableCell>
                  <TableCell className="py-2 text-center text-[10px] text-muted-foreground sm:text-[11px]">
                    {t("games.boxScoreLabels.goals")}
                  </TableCell>
                  <TableCell className="py-2 text-center text-[10px] text-muted-foreground sm:text-[11px]">
                    {t("games.boxScoreLabels.yellowCards")}
                  </TableCell>
                  <TableCell className="py-2 text-center text-[10px] text-muted-foreground sm:text-[11px]">
                    {t("games.boxScoreLabels.redCards")}
                  </TableCell>
                  <TableCell className="py-2 text-center text-[10px] text-muted-foreground sm:text-[11px]">
                    {t("games.boxScoreLabels.penalties")}
                  </TableCell>
                  <TableCell className="py-2 text-center text-[10px] text-muted-foreground sm:text-[11px]">
                    {t("games.boxScoreLabels.subIn")}
                  </TableCell>
                  <TableCell className="py-2 text-center text-[10px] text-muted-foreground sm:text-[11px]">
                    {t("games.boxScoreLabels.subOut")}
                  </TableCell>
                </TableRow>
                {bench.map(renderPlayerRow)}
              </>
            ) : null}

            <TableRow className="bg-muted/50 font-semibold">
              <TableCell className="sticky left-0 z-10 bg-muted/50 py-2 text-[10px] uppercase sm:text-[11px]">
                {t("games.boxScoreLabels.team")}
              </TableCell>
              <TableCell className="py-2 text-center tabular-nums text-[11px] sm:text-xs">
                {totals.goals}
              </TableCell>
              <TableCell className="py-2 text-center tabular-nums text-[11px] sm:text-xs">
                {totals.yellowCards}
              </TableCell>
              <TableCell className="py-2 text-center tabular-nums text-[11px] sm:text-xs">
                {totals.redCards}
              </TableCell>
              <TableCell className="py-2 text-center tabular-nums text-[11px] sm:text-xs">
                {formatPenaltySummary(
                  totals.penaltiesScored,
                  totals.penaltiesAttempted,
                )}
              </TableCell>
              <TableCell className="py-2 text-center tabular-nums text-[11px] sm:text-xs">
                {totals.substitutions}
              </TableCell>
              <TableCell className="py-2 text-center text-[11px] text-muted-foreground sm:text-xs">
                —
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}

interface GameBoxScoreTablesProps {
  homeTeam: Team;
  awayTeam: Team;
  homeStats: PlayerGameStats[];
  awayStats: PlayerGameStats[];
  homeTotals: TeamGameTotals;
  awayTotals: TeamGameTotals;
  className?: string;
  tableClassName?: string;
}

export function GameBoxScoreTables({
  homeTeam,
  awayTeam,
  homeStats,
  awayStats,
  homeTotals,
  awayTotals,
  className,
  tableClassName,
}: GameBoxScoreTablesProps) {
  const t = useTranslations("Common");
  const homeData = transformTeamStats(homeStats, homeTotals);
  const awayData = transformTeamStats(awayStats, awayTotals);
  const hasStats =
    homeStats.length > 0 ||
    awayStats.length > 0 ||
    Object.values(homeData.totals).some((value) => value > 0) ||
    Object.values(awayData.totals).some((value) => value > 0);

  return (
    <div className={cn("w-full min-w-0 space-y-6 pt-3", className)}>
      <TeamBoxScore
        team={homeTeam}
        starters={homeData.starters}
        bench={homeData.bench}
        totals={homeData.totals}
        t={t}
        className={tableClassName}
      />

      <TeamBoxScore
        team={awayTeam}
        starters={awayData.starters}
        bench={awayData.bench}
        totals={awayData.totals}
        t={t}
        className={tableClassName}
      />

      {!hasStats ? (
        <p className="text-center text-xs text-muted-foreground">
          {t("games.boxScoreNote")}
        </p>
      ) : null}
    </div>
  );
}

export function GameBoxScore({ game }: GameBoxScoreProps) {
  const gameStats = useQuery(api.games.getGamePlayerStats, {
    gameId: game._id as Id<"games">,
  });

  const homeTeam: Team = {
    name: game.homeTeamName,
    logoUrl: game.homeTeamLogo,
    primaryColor: game.homeTeamColor,
  };

  const awayTeam: Team = {
    name: game.awayTeamName,
    logoUrl: game.awayTeamLogo,
    primaryColor: game.awayTeamColor,
  };

  return (
    <GameBoxScoreTables
      homeTeam={homeTeam}
      awayTeam={awayTeam}
      homeStats={gameStats?.homeStats ?? []}
      awayStats={gameStats?.awayStats ?? []}
      homeTotals={gameStats?.homeTeamStats ?? emptyTeamTotals}
      awayTotals={gameStats?.awayTeamStats ?? emptyTeamTotals}
    />
  );
}
