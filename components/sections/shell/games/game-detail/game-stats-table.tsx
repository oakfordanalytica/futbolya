"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Heading } from "@/components/ui/heading";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  key: string;
  home: string;
  away: string;
  isSubRow?: boolean;
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

  const bgColor = "#6b7280";
  const initial = team.name.charAt(0).toUpperCase();

  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold"
      style={{
        backgroundColor: bgColor,
        width: size,
        height: size,
        fontSize: size * 0.5,
      }}
    >
      {initial}
    </div>
  );
}

function StatsSection({
  title,
  stats,
  t,
  homeTeam,
  awayTeam,
}: {
  title: string;
  stats: StatRow[];
  t: (key: string) => string;
  homeTeam: Team;
  awayTeam: Team;
}) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-1/2 font-semibold uppercase text-xs tracking-wide">
              {title}
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
          {stats.map((stat) => (
            <TableRow key={stat.key}>
              <TableCell
                className={`font-medium ${stat.isSubRow ? "pl-8 text-muted-foreground" : ""}`}
              >
                {t(`games.statsLabels.${stat.key}`)}
              </TableCell>
              <TableCell className="text-center tabular-nums">
                {stat.home}
              </TableCell>
              <TableCell className="text-center tabular-nums">
                {stat.away}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function GameStatsTable({ game }: GameStatsTableProps) {
  const t = useTranslations("Common");

  const homeTeam: Team = {
    name: game.homeTeamName,
    logoUrl: game.homeTeamLogo,
  };

  const awayTeam: Team = {
    name: game.awayTeamName,
    logoUrl: game.awayTeamLogo,
  };

  // Individual Statistics - Offensive
  const individualOffensive: StatRow[] = [
    { key: "ppg", home: "—", away: "—" },
    { key: "fgPct", home: "—", away: "—" },
    { key: "threePct", home: "—", away: "—" },
    { key: "ftPct", home: "—", away: "—" },
    { key: "apg", home: "—", away: "—" },
    { key: "turnovers", home: "—", away: "—" },
  ];

  // Individual Statistics - Defensive
  const individualDefensive: StatRow[] = [
    { key: "rpg", home: "—", away: "—" },
    { key: "offReb", home: "—", away: "—", isSubRow: true },
    { key: "defReb", home: "—", away: "—", isSubRow: true },
    { key: "spg", home: "—", away: "—" },
    { key: "bpg", home: "—", away: "—" },
    { key: "pf", home: "—", away: "—" },
  ];

  // Individual Statistics - Efficiency
  const individualEfficiency: StatRow[] = [
    { key: "eff", home: "—", away: "—" },
    { key: "plusMinus", home: "—", away: "—" },
    { key: "mpg", home: "—", away: "—" },
  ];

  // Team Statistics
  const teamStats: StatRow[] = [
    { key: "teamPpg", home: "—", away: "—" },
    { key: "teamPpgAllowed", home: "—", away: "—" },
    { key: "teamFgPct", home: "—", away: "—" },
    { key: "teamRebTotal", home: "—", away: "—" },
    { key: "teamRebOff", home: "—", away: "—", isSubRow: true },
    { key: "teamRebDef", home: "—", away: "—", isSubRow: true },
    { key: "teamAssists", home: "—", away: "—" },
    { key: "teamTurnovers", home: "—", away: "—" },
    { key: "teamSteals", home: "—", away: "—" },
    { key: "teamBlocks", home: "—", away: "—" },
    { key: "teamFouls", home: "—", away: "—" },
    { key: "astToRatio", home: "—", away: "—" },
  ];

  return (
    <div className="space-y-8">
      <section className="space-y-6">
        <Heading level={3}>{t("games.statsHeaders.individual")}</Heading>

        <StatsSection
          title={t("games.statsHeaders.offensive")}
          stats={individualOffensive}
          t={t}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
        />

        <StatsSection
          title={t("games.statsHeaders.defensive")}
          stats={individualDefensive}
          t={t}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
        />

        <StatsSection
          title={t("games.statsHeaders.efficiency")}
          stats={individualEfficiency}
          t={t}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
        />
      </section>

      <section className="space-y-4">
        <Heading level={3}>{t("games.statsHeaders.team")}</Heading>
        <StatsSection
          title=""
          stats={teamStats}
          t={t}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
        />
      </section>

      <p className="text-center text-sm text-muted-foreground">
        {t("games.statsComingSoon")}
      </p>
    </div>
  );
}
