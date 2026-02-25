"use client";

import { useEffect, useMemo, useState } from "react";
import { Preloaded, usePreloadedQuery, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { api } from "@/convex/_generated/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SeasonStatsPageProps {
  preloadedSeasons: Preloaded<typeof api.leagueSettings.listSeasons>;
  orgSlug: string;
}

type PlayerMetricKey =
  | "pointsPerGame"
  | "reboundsPerGame"
  | "assistsPerGame"
  | "stealsPerGame"
  | "blocksPerGame";

type TeamMetricKey =
  | "pointsForPerGame"
  | "pointsAllowedPerGame"
  | "reboundsPerGame"
  | "assistsPerGame"
  | "winPct";

function formatOneDecimal(value: number): string {
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
    pointsPerGame: number;
    reboundsPerGame: number;
    assistsPerGame: number;
    stealsPerGame: number;
    blocksPerGame: number;
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
                </span>{" "}
                <span className="text-muted-foreground text-sm">
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
  isPercent,
}: {
  title: string;
  rows: Array<{
    clubId: string;
    clubName: string;
    pointsForPerGame: number;
    pointsAllowedPerGame: number;
    reboundsPerGame: number;
    assistsPerGame: number;
    winPct: number;
  }>;
  metricKey: TeamMetricKey;
  isPercent?: boolean;
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
                {isPercent ? "%" : ""}
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

    if (
      !selectedSeasonId ||
      !seasons.some((season) => season.id === selectedSeasonId)
    ) {
      setSelectedSeasonId(seasons[0].id);
    }
  }, [seasons, selectedSeasonId]);

  const leaders = useQuery(
    api.games.getSeasonLeaders,
    selectedSeasonId
      ? {
          orgSlug,
          seasonId: selectedSeasonId,
          limit: 5,
        }
      : "skip",
  );

  const selectedSeasonName = useMemo(
    () => seasons.find((season) => season.id === selectedSeasonId)?.name ?? "",
    [seasons, selectedSeasonId],
  );

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
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-wide">
            {t("games.leaders.seasonLeaders")}
          </h1>
          {selectedSeasonName && (
            <p className="text-sm text-muted-foreground">
              {selectedSeasonName}
            </p>
          )}
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

      {leaders === undefined ? (
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
            <div className="mb-4 flex items-center justify-between border-b pb-3">
              <h2 className="text-3xl font-black uppercase tracking-wide">
                {t("games.leaders.playersTitle")}
              </h2>
              <span className="text-xs font-medium uppercase text-muted-foreground">
                {t("games.leaders.gamesCount", { count: leaders.gamesCount })}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              <PlayerLeadersCard
                title={t("games.statsLabels.ppg")}
                rows={leaders.playerLeaders.pointsPerGame}
                metricKey="pointsPerGame"
              />
              <PlayerLeadersCard
                title={t("games.statsLabels.rpg")}
                rows={leaders.playerLeaders.reboundsPerGame}
                metricKey="reboundsPerGame"
              />
              <PlayerLeadersCard
                title={t("games.statsLabels.apg")}
                rows={leaders.playerLeaders.assistsPerGame}
                metricKey="assistsPerGame"
              />
              <PlayerLeadersCard
                title={t("games.statsLabels.spg")}
                rows={leaders.playerLeaders.stealsPerGame}
                metricKey="stealsPerGame"
              />
              <PlayerLeadersCard
                title={t("games.statsLabels.bpg")}
                rows={leaders.playerLeaders.blocksPerGame}
                metricKey="blocksPerGame"
              />
            </div>
          </section>

          <section className="rounded-md border bg-card p-4 md:p-5">
            <div className="mb-4 flex items-center justify-between border-b pb-3">
              <h2 className="text-3xl font-black uppercase tracking-wide">
                {t("games.leaders.teamsTitle")}
              </h2>
              <span className="text-xs font-medium uppercase text-muted-foreground">
                {t("games.leaders.gamesCount", { count: leaders.gamesCount })}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              <TeamLeadersCard
                title={t("games.statsLabels.teamPpg")}
                rows={leaders.teamLeaders.pointsForPerGame}
                metricKey="pointsForPerGame"
              />
              <TeamLeadersCard
                title={t("games.statsLabels.teamPpgAllowed")}
                rows={leaders.teamLeaders.pointsAllowedPerGame}
                metricKey="pointsAllowedPerGame"
              />
              <TeamLeadersCard
                title={t("games.statsLabels.teamRebTotal")}
                rows={leaders.teamLeaders.reboundsPerGame}
                metricKey="reboundsPerGame"
              />
              <TeamLeadersCard
                title={t("games.statsLabels.teamAssists")}
                rows={leaders.teamLeaders.assistsPerGame}
                metricKey="assistsPerGame"
              />
              <TeamLeadersCard
                title={t("games.leaders.winPct")}
                rows={leaders.teamLeaders.winPct}
                metricKey="winPct"
                isPercent
              />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
