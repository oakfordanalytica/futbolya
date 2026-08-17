"use client";

import Image from "next/image";
import { useSyncExternalStore } from "react";
import { ArrowRight, Radio } from "lucide-react";
import { usePreloadedQuery, type Preloaded } from "convex/react";
import { useLocale, useTranslations } from "next-intl";
import { api } from "@/convex/_generated/api";
import { PublicMatchLineups } from "@/components/sections/public/public-match-lineups";
import { GameBoxScoreTables } from "@/components/sections/shell/games/game-detail/game-box-score";
import {
  MatchTimelineView,
  type MatchTimelineEvent,
} from "@/components/sections/shell/games/game-detail/match-timeline-view";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "@/i18n/navigation";
import {
  getMatchTiming,
  type MatchTimingSource,
} from "@/lib/games/match-timing";
import { ROUTES } from "@/lib/navigation/routes";
import {
  formatPenaltySummary,
  type TeamGameTotals,
} from "@/lib/soccer/game-stats";
import { parseLocalDateTime } from "@/lib/utils/date";
import { useMatchTimingNow } from "@/hooks/use-match-timing-now";
import { cn } from "@/lib/utils";

type PublicGameStatus =
  | "scheduled"
  | "in_progress"
  | "halftime"
  | "completed"
  | "cancelled";
type PublicTimingGame = MatchTimingSource & { status: PublicGameStatus };

export type PublicGameSummary = PublicTimingGame & {
  id: string;
  category: string;
  gender: "male" | "female" | "mixed";
  homeScore: number;
  awayScore: number;
  homeTeam: { name: string; logoUrl?: string; color?: string };
  awayTeam: { name: string; logoUrl?: string; color?: string };
};

function useIsMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

function formatKickoff(date: string, startTime: string, locale: string) {
  const kickoff = parseLocalDateTime(date, startTime);
  if (!kickoff) return `${date} · ${startTime}`;
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(kickoff);
}

function TeamLogo({
  name,
  logoUrl,
  compact = false,
}: {
  name: string;
  logoUrl?: string;
  compact?: boolean;
}) {
  const size = compact ? 24 : 52;
  return logoUrl ? (
    <Image
      src={logoUrl}
      alt=""
      width={size}
      height={size}
      className={compact ? "size-6 object-contain" : "size-13 object-contain"}
    />
  ) : (
    <span
      className={
        compact
          ? "flex size-6 shrink-0 items-center justify-center rounded-full bg-public-fog text-[10px] font-bold"
          : "flex size-13 shrink-0 items-center justify-center rounded-full bg-public-fog text-lg font-bold"
      }
      aria-hidden="true"
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

function MatchTeamIdentity({
  team,
  side,
}: {
  team: PublicGameSummary["homeTeam"];
  side: "home" | "away";
}) {
  return (
    <div className="relative isolate flex min-w-0 flex-col items-center gap-2 text-center">
      {team.color ? (
        <span
          className={cn(
            "pointer-events-none absolute -top-10 -bottom-5 -z-10 w-52 opacity-35 blur-2xl saturate-125 motion-safe:animate-[public-team-glow-drift_8s_ease-in-out_infinite_alternate] motion-safe:will-change-transform sm:w-72 sm:opacity-45",
            side === "home" ? "-left-12" : "-right-12",
          )}
          style={{
            animationDelay: side === "home" ? "0s" : "-4s",
            background: `
              radial-gradient(circle at ${side === "home" ? "28% 32%" : "72% 32%"}, ${team.color} 0 10%, transparent 38%),
              radial-gradient(ellipse at ${side === "home" ? "72% 68%" : "28% 68%"}, ${team.color} 0 16%, transparent 48%),
              repeating-linear-gradient(${side === "home" ? "125deg" : "55deg"}, transparent 0 18px, ${team.color} 20px 25px, transparent 27px 48px)
            `,
          }}
          aria-hidden="true"
        />
      ) : null}
      <TeamLogo name={team.name} logoUrl={team.logoUrl} />
      <span className="max-w-full truncate text-sm font-bold sm:text-lg">
        {team.name}
      </span>
    </div>
  );
}

function MatchStatus({
  game,
  nowMs,
}: {
  game: PublicTimingGame;
  nowMs: number | null;
}) {
  const t = useTranslations("Common");
  if (nowMs === null || game.status === "cancelled")
    return t(`games.statusOptions.${game.status}`);
  const timing = getMatchTiming(game, nowMs);
  switch (timing.matchPhase) {
    case "first_half":
      return t("games.center.firstHalfState", { minute: timing.liveMinute });
    case "halftime":
      return t("games.center.halftimeState");
    case "second_half":
      return t("games.center.secondHalfState", { minute: timing.liveMinute });
    case "finished":
      return t("games.center.endedState");
    default:
      return t(`games.statusOptions.${game.status}`);
  }
}

function PublicScore({
  game,
  className,
}: {
  game: PublicGameSummary;
  className: string;
}) {
  const t = useTranslations("Public");
  const scheduled = game.status === "scheduled";
  const live = game.status === "in_progress" || game.status === "halftime";
  return (
    <div className={className} aria-live={live ? "polite" : undefined}>
      <span aria-hidden="true">
        {scheduled ? t("live.versus") : `${game.homeScore}–${game.awayScore}`}
      </span>
      <span className="sr-only">
        {scheduled
          ? t("game.versusAnnouncement", {
              home: game.homeTeam.name,
              away: game.awayTeam.name,
            })
          : t("game.scoreAnnouncement", {
              home: game.homeTeam.name,
              homeScore: game.homeScore,
              away: game.awayTeam.name,
              awayScore: game.awayScore,
            })}
      </span>
    </div>
  );
}

export function PublicGameList({ games }: { games: PublicGameSummary[] }) {
  const nowMs = useMatchTimingNow(games);
  const mounted = useIsMounted();
  const locale = useLocale();
  const common = useTranslations("Common");

  return (
    <div className="border-t border-public-ink/15">
      {games.map((game) => (
        <Link
          key={game.id}
          href={ROUTES.public.liveGame(game.id)}
          className="grid min-h-18 grid-cols-[5.5rem_minmax(0,1fr)_2rem] items-center gap-3 border-b border-public-ink/15 px-3 py-2 outline-none transition-colors hover:bg-public-fog focus-visible:bg-public-fog focus-visible:ring-2 focus-visible:ring-public-sky sm:grid-cols-[7.5rem_minmax(0,1fr)_2.5rem]"
        >
          <div className="min-w-0 text-[11px] leading-tight text-public-ink/55">
            <div className="font-bold text-public-ink">
              <MatchStatus game={game} nowMs={mounted ? nowMs : null} />
            </div>
            <div className="mt-1 capitalize">
              {formatKickoff(game.date, game.startTime, locale)}
            </div>
            <div className="mt-1 truncate uppercase">
              {game.category} ·{" "}
              {common(`categories.genderOptions.${game.gender}`)}
            </div>
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex min-w-0 items-center gap-2">
              <TeamLogo
                compact
                name={game.homeTeam.name}
                logoUrl={game.homeTeam.logoUrl}
              />
              <span className="truncate text-sm font-semibold">
                {game.homeTeam.name}
              </span>
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <TeamLogo
                compact
                name={game.awayTeam.name}
                logoUrl={game.awayTeam.logoUrl}
              />
              <span className="truncate text-sm font-semibold">
                {game.awayTeam.name}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 text-base font-black tabular-nums">
            {game.status === "scheduled" ? (
              <>
                <span>—</span>
                <span>—</span>
              </>
            ) : (
              <>
                <span>{game.homeScore}</span>
                <span>{game.awayScore}</span>
              </>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}

export function LiveGames({
  preloadedGames,
}: {
  preloadedGames: Preloaded<typeof api.games.listPublicLive>;
}) {
  const games = usePreloadedQuery(preloadedGames);
  const t = useTranslations("Public");
  if (games.length === 0) {
    return (
      <Empty className="min-h-56 rounded-none border-x-0 border-public-ink/20 text-public-ink">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Radio />
          </EmptyMedia>
          <EmptyTitle>{t("live.emptyTitle")}</EmptyTitle>
          <EmptyDescription>{t("live.emptyDescription")}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }
  return <PublicGameList games={games} />;
}

function PublicTeamStats({
  homeTeam,
  awayTeam,
  home,
  away,
}: {
  homeTeam: PublicGameSummary["homeTeam"];
  awayTeam: PublicGameSummary["awayTeam"];
  home: TeamGameTotals;
  away: TeamGameTotals;
}) {
  const common = useTranslations("Common");
  const rows = [
    [common("games.gameStats.goals"), home.goals, away.goals],
    [common("games.gameStats.corners"), home.corners, away.corners],
    [common("games.gameStats.freeKicks"), home.freeKicks, away.freeKicks],
    [common("games.gameStats.yellowCards"), home.yellowCards, away.yellowCards],
    [common("games.gameStats.redCards"), home.redCards, away.redCards],
    [
      common("games.gameStats.penaltiesScored"),
      formatPenaltySummary(home.penaltiesScored, home.penaltiesAttempted),
      formatPenaltySummary(away.penaltiesScored, away.penaltiesAttempted),
    ],
    [
      common("games.gameStats.substitutions"),
      home.substitutions,
      away.substitutions,
    ],
  ];
  return (
    <section className="border-b border-public-ink/15 py-5">
      <h2 className="mb-3 text-lg font-bold">
        {common("games.statsHeaders.team")}
      </h2>
      <Table>
        <TableCaption className="sr-only">
          {common("games.statsHeaders.team")}
        </TableCaption>
        <TableHeader>
          <TableRow className="bg-public-fog/60">
            <TableHead className="w-1/2 text-xs font-semibold uppercase tracking-wide text-public-ink">
              {common("games.statsHeaders.team")}
            </TableHead>
            <TableHead className="w-1/4 text-center">
              <div className="flex justify-center">
                <TeamLogo
                  compact
                  name={homeTeam.name}
                  logoUrl={homeTeam.logoUrl}
                />
                <span className="sr-only">{homeTeam.name}</span>
              </div>
            </TableHead>
            <TableHead className="w-1/4 text-center">
              <div className="flex justify-center">
                <TeamLogo
                  compact
                  name={awayTeam.name}
                  logoUrl={awayTeam.logoUrl}
                />
                <span className="sr-only">{awayTeam.name}</span>
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(([label, homeValue, awayValue]) => (
            <TableRow key={String(label)}>
              <TableCell className="font-medium">{label}</TableCell>
              <TableCell className="text-center font-bold tabular-nums">
                {homeValue}
              </TableCell>
              <TableCell className="text-center font-bold tabular-nums">
                {awayValue}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}

export function PublicGameNotFound() {
  const t = useTranslations("Public");
  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-[60dvh] max-w-3xl flex-col justify-center px-4 py-12"
    >
      <h1 className="text-2xl font-black">{t("game.notFoundTitle")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {t("game.notFoundDescription")}
      </p>
      <Link
        href={ROUTES.public.games}
        className="mt-5 flex w-fit items-center gap-2 text-sm font-semibold hover:underline"
      >
        {t("game.back")}
        <ArrowRight aria-hidden="true" />
      </Link>
    </main>
  );
}

export function PublicGameDetail({
  preloadedGame,
}: {
  preloadedGame: Preloaded<typeof api.games.getPublicById>;
}) {
  const game = usePreloadedQuery(preloadedGame);
  const locale = useLocale();
  const common = useTranslations("Common");
  const nowMs = useMatchTimingNow(game);
  const mounted = useIsMounted();
  if (!game) return <PublicGameNotFound />;

  const playerNameById = new Map(
    [
      ...game.lineups.home.starters,
      ...game.lineups.home.substitutes,
      ...game.lineups.away.starters,
      ...game.lineups.away.substitutes,
    ].map((player) => [player.playerId, player.playerName]),
  );
  const timelineEvents = game.events.map<MatchTimelineEvent>((event) => ({
    id: String(event.sequence),
    side: event.side,
    type: event.type,
    minute: event.minute,
    primaryText: event.playerId
      ? playerNameById.get(event.playerId)
      : undefined,
    secondaryText: event.relatedPlayerId
      ? playerNameById.get(event.relatedPlayerId)
      : undefined,
  }));

  return (
    <main id="main-content" className="bg-public-paper pb-8 text-public-ink">
      <section className="mx-auto max-w-6xl px-4 py-5 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 text-sm">
          <Badge variant="outline">
            {game.status === "in_progress" || game.status === "halftime" ? (
              <span className="size-1.5 rounded-full bg-public-sky motion-safe:animate-pulse" />
            ) : null}
            <MatchStatus game={game} nowMs={mounted ? nowMs : null} />
          </Badge>
          <span className="text-muted-foreground">
            {formatKickoff(game.date, game.startTime, locale)} · {game.category}{" "}
            · {common(`categories.genderOptions.${game.gender}`)}
          </span>
        </div>
        <h1 className="sr-only">
          {game.homeTeam.name} – {game.awayTeam.name}
        </h1>
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 py-6 sm:gap-8">
          <MatchTeamIdentity team={game.homeTeam} side="home" />
          <PublicScore
            game={game}
            className="text-4xl font-black tracking-tight tabular-nums sm:text-6xl"
          />
          <MatchTeamIdentity team={game.awayTeam} side="away" />
        </div>
      </section>

      <Tabs defaultValue="summary" className="mx-auto mt-4 max-w-6xl gap-0">
        <div className="border-y border-public-ink/15">
          <TabsList className="flex min-h-13 w-full justify-start rounded-none px-4 pt-2 pb-0 [--tabs-indicator-bottom:1px] [&>button>span]:bg-public-sky md:px-6">
            <TabsTrigger
              value="summary"
              className="h-auto flex-none self-stretch rounded-none px-2 pt-2 pb-3"
            >
              {common("games.summary")}
            </TabsTrigger>
            <TabsTrigger
              value="stats"
              className="h-auto flex-none self-stretch rounded-none px-2 pt-2 pb-3"
            >
              {common("games.stats")}
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="summary" className="mt-0 px-4 md:px-0">
          <div className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)] xl:items-start">
            <PublicMatchLineups
              homeTeam={game.homeTeam}
              awayTeam={game.awayTeam}
              lineups={game.lineups}
              events={game.events}
              className="rounded-none border-x-0 border-t-0 border-public-ink/15 bg-transparent shadow-none"
            />
            <div className="min-w-0 space-y-6">
              <MatchTimelineView
                homeTeam={game.homeTeam}
                awayTeam={game.awayTeam}
                events={timelineEvents}
                className="rounded-none border-x-0 border-public-ink/15 bg-transparent shadow-none xl:border-t-0"
              />
              <GameBoxScoreTables
                homeTeam={{
                  name: game.homeTeam.name,
                  logoUrl: game.homeTeam.logoUrl,
                  primaryColor: game.homeTeam.color,
                }}
                awayTeam={{
                  name: game.awayTeam.name,
                  logoUrl: game.awayTeam.logoUrl,
                  primaryColor: game.awayTeam.color,
                }}
                homeStats={game.playerStats.home}
                awayStats={game.playerStats.away}
                homeTotals={game.teamStats.home}
                awayTotals={game.teamStats.away}
                className="pt-0"
                tableClassName="rounded-none border-x-0 border-public-ink/15"
              />
            </div>
          </div>
        </TabsContent>
        <TabsContent value="stats" className="mt-0 px-4 md:px-0">
          <PublicTeamStats
            homeTeam={game.homeTeam}
            awayTeam={game.awayTeam}
            home={game.teamStats.home}
            away={game.teamStats.away}
          />
        </TabsContent>
      </Tabs>
    </main>
  );
}
