"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Heading } from "@/components/ui/heading";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  emptyTeamTotals,
  type TeamGameTotals,
} from "@/lib/sports/soccer/game-stats";

interface Team {
  name: string;
  logoUrl?: string;
}

interface GameStatsTableProps {
  game: {
    _id: string;
    homeTeamName: string;
    awayTeamName: string;
    homeTeamLogo?: string;
    awayTeamLogo?: string;
  };
}

interface StatRow {
  label: string;
  home: string | number;
  away: string | number;
}

function TeamLogo({ team, size = 32 }: { team: Team; size?: number }) {
  if (team.logoUrl) {
    return (
      <Image
        src={team.logoUrl}
        alt={team.name}
        width={size}
        height={size}
        className="object-contain"
      />
    );
  }

  return (
    <div
      className="flex items-center justify-center rounded-full text-white font-bold"
      style={{
        backgroundColor: "#6b7280",
        width: size,
        height: size,
        fontSize: size * 0.5,
      }}
    >
      {team.name.charAt(0).toUpperCase()}
    </div>
  );
}

function formatPenaltySummary(scored: number, attempted: number) {
  return attempted > 0 ? `${scored}/${attempted}` : "—";
}

function buildStatsRows(
  homeTotals: TeamGameTotals,
  awayTotals: TeamGameTotals,
  t: (key: string) => string,
): StatRow[] {
  return [
    {
      label: t("games.gameStats.goals"),
      home: homeTotals.goals,
      away: awayTotals.goals,
    },
    {
      label: t("games.gameStats.corners"),
      home: homeTotals.corners,
      away: awayTotals.corners,
    },
    {
      label: t("games.gameStats.freeKicks"),
      home: homeTotals.freeKicks,
      away: awayTotals.freeKicks,
    },
    {
      label: t("games.gameStats.yellowCards"),
      home: homeTotals.yellowCards,
      away: awayTotals.yellowCards,
    },
    {
      label: t("games.gameStats.redCards"),
      home: homeTotals.redCards,
      away: awayTotals.redCards,
    },
    {
      label: t("games.gameStats.penaltiesScored"),
      home: formatPenaltySummary(
        homeTotals.penaltiesScored,
        homeTotals.penaltiesAttempted,
      ),
      away: formatPenaltySummary(
        awayTotals.penaltiesScored,
        awayTotals.penaltiesAttempted,
      ),
    },
    {
      label: t("games.gameStats.substitutions"),
      home: homeTotals.substitutions,
      away: awayTotals.substitutions,
    },
  ];
}

export function GameStatsTable({ game }: GameStatsTableProps) {
  const t = useTranslations("Common");

  const gameStats = useQuery(api.games.getGamePlayerStats, {
    gameId: game._id as Id<"games">,
  });

  const homeTeam: Team = {
    name: game.homeTeamName,
    logoUrl: game.homeTeamLogo,
  };

  const awayTeam: Team = {
    name: game.awayTeamName,
    logoUrl: game.awayTeamLogo,
  };

  const homeTotals = gameStats?.homeTeamStats ?? emptyTeamTotals;
  const awayTotals = gameStats?.awayTeamStats ?? emptyTeamTotals;

  const hasStats =
    (gameStats?.homeStats?.length ?? 0) > 0 ||
    (gameStats?.awayStats?.length ?? 0) > 0 ||
    Object.values(homeTotals).some((value) => value > 0) ||
    Object.values(awayTotals).some((value) => value > 0);

  const rows = buildStatsRows(homeTotals, awayTotals, t);

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <Heading level={3}>{t("games.statsHeaders.team")}</Heading>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-1/2 font-semibold uppercase text-xs tracking-wide">
                  {t("games.statsHeaders.team")}
                </TableHead>
                <TableHead className="w-1/4 text-center">
                  <div className="flex justify-center">
                    <TeamLogo team={homeTeam} size={28} />
                  </div>
                </TableHead>
                <TableHead className="w-1/4 text-center">
                  <div className="flex justify-center">
                    <TeamLogo team={awayTeam} size={28} />
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.label}>
                  <TableCell className="font-medium">{row.label}</TableCell>
                  <TableCell className="text-center tabular-nums">
                    {row.home}
                  </TableCell>
                  <TableCell className="text-center tabular-nums">
                    {row.away}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      {!hasStats ? (
        <p className="text-center text-sm text-muted-foreground">
          {t("games.statsComingSoon")}
        </p>
      ) : null}
    </div>
  );
}
