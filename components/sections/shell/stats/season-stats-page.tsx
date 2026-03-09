"use client";

import { useEffect, useMemo, useState } from "react";
import { Preloaded, usePreloadedQuery, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/table/data-table";
import {
  COMPACT_STATS_TABLE_CLASS,
  createSeasonPlayerStatsColumns,
  createSeasonPlayerStatsFilterConfigs,
  createSeasonTeamStatsColumns,
} from "@/components/sections/shell/stats/stats-columns";

interface SeasonStatsPageProps {
  preloadedSeasons: Preloaded<typeof api.leagueSettings.listSeasons>;
  orgSlug: string;
}

type PlayerMetricKey =
  | "goals"
  | "goalsPerGame"
  | "yellowCards"
  | "redCards"
  | "penaltiesScored";

type TeamMetricKey =
  | "points"
  | "goalsFor"
  | "goalsAgainst"
  | "goalDifference"
  | "cleanSheets";

type StatsTab = "home" | "players" | "teams";

const VALID_STATS_TABS: StatsTab[] = ["home", "players", "teams"];
const DEFAULT_TAB: StatsTab = "home";

function isStatsTab(value: string | null): value is StatsTab {
  return value !== null && VALID_STATS_TABS.includes(value as StatsTab);
}

function formatOneDecimal(value: number): string {
  if (Number.isInteger(value)) {
    return value.toLocaleString(undefined, {
      maximumFractionDigits: 0,
    });
  }
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function PlayerLeadersCard({
  title,
  rows,
  metricKey,
}: {
  title: string;
  rows: Array<{
    playerId: string;
    playerName: string;
    clubName: string;
    goals: number;
    goalsPerGame: number;
    yellowCards: number;
    redCards: number;
    penaltiesScored: number;
  }>;
  metricKey: PlayerMetricKey;
}) {
  return (
    <article className="border-t pt-3">
      <h3 className="text-primary text-base font-extrabold uppercase tracking-wide">
        {title}
      </h3>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">—</p>
      ) : (
        <ol className="mt-2 space-y-1.5">
          {rows.map((row, index) => (
            <li
              key={row.playerId}
              className="flex items-baseline justify-between gap-3"
            >
              <div className="min-w-0 text-base">
                <span className="font-semibold">
                  {index + 1}. {row.playerName}
                </span>
                <span className="ml-2 text-sm text-muted-foreground">
                  {row.clubName}
                </span>
              </div>
              <span className="shrink-0 text-base font-bold tabular-nums">
                {formatOneDecimal(row[metricKey])}
              </span>
            </li>
          ))}
        </ol>
      )}
    </article>
  );
}

function TeamLeadersCard({
  title,
  rows,
  metricKey,
}: {
  title: string;
  rows: Array<{
    clubId: string;
    clubName: string;
    points: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    cleanSheets: number;
  }>;
  metricKey: TeamMetricKey;
}) {
  return (
    <article className="border-t pt-3">
      <h3 className="text-primary text-base font-extrabold uppercase tracking-wide">
        {title}
      </h3>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">—</p>
      ) : (
        <ol className="mt-2 space-y-1.5">
          {rows.map((row, index) => (
            <li
              key={row.clubId}
              className="flex items-baseline justify-between gap-3"
            >
              <div className="min-w-0 text-base">
                <span className="font-semibold">
                  {index + 1}. {row.clubName}
                </span>
              </div>
              <span className="shrink-0 text-base font-bold tabular-nums">
                {formatOneDecimal(row[metricKey])}
              </span>
            </li>
          ))}
        </ol>
      )}
    </article>
  );
}

export function SeasonStatsPage({
  preloadedSeasons,
  orgSlug,
}: SeasonStatsPageProps) {
  const t = useTranslations("Common");
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawTab = searchParams.get("tab");
  const activeTab: StatsTab = isStatsTab(rawTab) ? rawTab : DEFAULT_TAB;

  const seasons = usePreloadedQuery(preloadedSeasons);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>(
    () => seasons[0]?.id ?? "",
  );

  useEffect(() => {
    if (seasons.length === 0) {
      if (selectedSeasonId) {
        setSelectedSeasonId("");
      }
      return;
    }

    if (!seasons.some((season) => season.id === selectedSeasonId)) {
      setSelectedSeasonId(seasons[0].id);
    }
  }, [seasons, selectedSeasonId]);

  const leaders = useQuery(
    api.games.getSeasonLeaders,
    activeTab === "home" && selectedSeasonId
      ? {
          orgSlug,
          seasonId: selectedSeasonId,
          limit: 5,
        }
      : "skip",
  );

  const seasonStatsTable = useQuery(
    api.games.getSeasonStatsTable,
    activeTab !== "home" && selectedSeasonId
      ? {
          orgSlug,
          seasonId: selectedSeasonId,
        }
      : "skip",
  );

  const selectedSeasonName = useMemo(
    () => seasons.find((season) => season.id === selectedSeasonId)?.name ?? "",
    [seasons, selectedSeasonId],
  );

  const playerColumns = useMemo(() => createSeasonPlayerStatsColumns(t), [t]);
  const teamColumns = useMemo(() => createSeasonTeamStatsColumns(t), [t]);

  const playerRows = seasonStatsTable?.players ?? [];
  const teamRows = seasonStatsTable?.teams ?? [];

  const playerFilterConfigs = useMemo(
    () => createSeasonPlayerStatsFilterConfigs(t, playerRows),
    [playerRows, t],
  );

  const updateTabInUrl = (tab: StatsTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    const nextQuery = params.toString();
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    router.replace(nextUrl, { scroll: false });
  };

  if (seasons.length === 0) {
    return (
      <div className="p-4 md:p-6">
        <div className="rounded-md border bg-card p-4 text-sm text-muted-foreground">
          {t("games.leaders.noSeasons")}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Tabs
        value={activeTab}
        onValueChange={(value) => updateTabInUrl(value as StatsTab)}
        className="gap-0"
      >
        <TabsList className="flex h-fit w-full items-center gap-2 overflow-x-auto overflow-y-hidden border-b pb-2.5 pt-1">
          <TabsTrigger value="home" className="mr-0 flex-none px-3 py-1.5">
            {t("games.leaders.tabs.home")}
          </TabsTrigger>
          <TabsTrigger value="players" className="mr-0 flex-none px-3 py-1.5">
            {t("games.leaders.tabs.players")}
          </TabsTrigger>
          <TabsTrigger value="teams" className="mr-0 flex-none px-3 py-1.5">
            {t("games.leaders.tabs.teams")}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-wide">
            {activeTab === "home"
              ? t("games.leaders.seasonLeaders")
              : activeTab === "players"
                ? t("games.leaders.playersStatsTitle")
                : t("games.leaders.teamsStatsTitle")}
          </h1>
          {selectedSeasonName ? (
            <p className="text-sm text-muted-foreground">
              {selectedSeasonName}
            </p>
          ) : null}
        </div>

        <div className="w-full md:w-[280px]">
          <Select value={selectedSeasonId} onValueChange={setSelectedSeasonId}>
            <SelectTrigger className="w-full bg-card">
              <SelectValue placeholder={t("games.selectSeason")} />
            </SelectTrigger>
            <SelectContent>
              {seasons.map((season) => (
                <SelectItem key={season.id} value={season.id}>
                  {season.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      {activeTab === "home" ? (
        leaders === undefined ? (
          <div className="rounded-md border bg-card p-4 text-sm text-muted-foreground">
            {t("games.leaders.loading")}
          </div>
        ) : leaders.gamesCount === 0 ? (
          <div className="rounded-md border bg-card p-4 text-sm text-muted-foreground">
            {t("games.leaders.noSeasonGames")}
          </div>
        ) : (
          <>
            <section className="rounded-md border bg-card p-4 md:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-3xl font-black uppercase tracking-wide">
                    {t("games.leaders.playersTitle")}
                  </h2>
                  <span className="text-xs font-medium uppercase text-muted-foreground">
                    {t("games.leaders.gamesCount", {
                      count: leaders.gamesCount,
                    })}
                  </span>
                </div>
                <Button
                  variant="link"
                  className="h-auto p-0 text-primary"
                  onClick={() => updateTabInUrl("players")}
                >
                  {t("games.leaders.seeAllPlayersStats")}
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                <PlayerLeadersCard
                  title={t("games.statsLabels.goals")}
                  rows={leaders.playerLeaders.goals}
                  metricKey="goals"
                />
                <PlayerLeadersCard
                  title={t("games.statsLabels.goalsPerGame")}
                  rows={leaders.playerLeaders.goalsPerGame}
                  metricKey="goalsPerGame"
                />
                <PlayerLeadersCard
                  title={t("games.statsLabels.penaltiesScored")}
                  rows={leaders.playerLeaders.penaltiesScored}
                  metricKey="penaltiesScored"
                />
                <PlayerLeadersCard
                  title={t("games.statsLabels.yellowCards")}
                  rows={leaders.playerLeaders.yellowCards}
                  metricKey="yellowCards"
                />
                <PlayerLeadersCard
                  title={t("games.statsLabels.redCards")}
                  rows={leaders.playerLeaders.redCards}
                  metricKey="redCards"
                />
              </div>
            </section>

            <section className="rounded-md border bg-card p-4 md:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-3xl font-black uppercase tracking-wide">
                    {t("games.leaders.teamsTitle")}
                  </h2>
                  <span className="text-xs font-medium uppercase text-muted-foreground">
                    {t("games.leaders.gamesCount", {
                      count: leaders.gamesCount,
                    })}
                  </span>
                </div>
                <Button
                  variant="link"
                  className="h-auto p-0 text-primary"
                  onClick={() => updateTabInUrl("teams")}
                >
                  {t("games.leaders.seeAllTeamsStats")}
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                <TeamLeadersCard
                  title={t("games.statsLabels.points")}
                  rows={leaders.teamLeaders.points}
                  metricKey="points"
                />
                <TeamLeadersCard
                  title={t("games.statsLabels.goalsFor")}
                  rows={leaders.teamLeaders.goalsFor}
                  metricKey="goalsFor"
                />
                <TeamLeadersCard
                  title={t("games.statsLabels.goalsAgainst")}
                  rows={leaders.teamLeaders.goalsAgainst}
                  metricKey="goalsAgainst"
                />
                <TeamLeadersCard
                  title={t("games.statsLabels.goalDifference")}
                  rows={leaders.teamLeaders.goalDifference}
                  metricKey="goalDifference"
                />
                <TeamLeadersCard
                  title={t("games.statsLabels.cleanSheets")}
                  rows={leaders.teamLeaders.cleanSheets}
                  metricKey="cleanSheets"
                />
              </div>
            </section>
          </>
        )
      ) : null}

      {activeTab === "players" ? (
        <div className="space-y-3">
          {seasonStatsTable === undefined ? (
            <div className="rounded-md border bg-card p-4 text-sm text-muted-foreground">
              {t("games.leaders.loading")}
            </div>
          ) : (
            <div className={COMPACT_STATS_TABLE_CLASS}>
              <DataTable
                columns={playerColumns}
                data={playerRows}
                filterColumn="search"
                filterPlaceholder={t("games.leaders.playersSearchPlaceholder")}
                filterConfigs={playerFilterConfigs}
                emptyMessage={t("games.leaders.playersEmpty")}
                columnsMenuLabel={t("table.columns")}
                filtersMenuLabel={t("table.filters")}
                previousLabel={t("actions.previous")}
                nextLabel={t("actions.next")}
                initialSorting={[{ id: "goals", desc: true }]}
              />
            </div>
          )}
        </div>
      ) : null}

      {activeTab === "teams" ? (
        <div className="space-y-3">
          {seasonStatsTable === undefined ? (
            <div className="rounded-md border bg-card p-4 text-sm text-muted-foreground">
              {t("games.leaders.loading")}
            </div>
          ) : (
            <div className={COMPACT_STATS_TABLE_CLASS}>
              <DataTable
                columns={teamColumns}
                data={teamRows}
                filterColumn="search"
                filterPlaceholder={t("games.leaders.teamsSearchPlaceholder")}
                emptyMessage={t("games.leaders.teamsEmpty")}
                columnsMenuLabel={t("table.columns")}
                filtersMenuLabel={t("table.filters")}
                previousLabel={t("actions.previous")}
                nextLabel={t("actions.next")}
                initialSorting={[{ id: "points", desc: true }]}
              />
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
