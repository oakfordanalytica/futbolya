"use client";

import { usePreloadedQuery, type Preloaded } from "convex/react";
import { useTranslations } from "next-intl";
import { api } from "@/convex/_generated/api";
import {
  PublicGameList,
  type PublicGameSummary,
} from "@/components/sections/public/public-games";
import { PublicStandings } from "@/components/sections/public/public-standings";
import { GamesDateStrip } from "@/components/patterns/games-date-strip";
import { ROUTES } from "@/lib/navigation/routes";

function GameGroup({
  id,
  title,
  games,
  emptyMessage,
}: {
  id: string;
  title: string;
  games: PublicGameSummary[];
  emptyMessage: string;
}) {
  return (
    <section aria-labelledby={id}>
      <h2
        id={id}
        className="border-b border-public-ink/20 bg-public-fog px-3 py-2 text-sm font-extrabold uppercase tracking-wide"
      >
        {title}
      </h2>
      {games.length === 0 ? (
        <p className="border-b border-public-ink/20 px-3 py-6 text-sm text-public-ink/50">
          {emptyMessage}
        </p>
      ) : (
        <PublicGameList games={games} />
      )}
    </section>
  );
}

export function PublicGamesDirectory({
  preloadedGames,
  preloadedStandings,
}: {
  preloadedGames: Preloaded<typeof api.games.listPublicGames>;
  preloadedStandings: Preloaded<typeof api.games.getPublicSeasonTable>;
}) {
  const games = usePreloadedQuery(preloadedGames);
  const t = useTranslations("Public");
  const common = useTranslations("Common");
  const allGames = [...games.recent, ...games.live, ...games.upcoming];

  return (
    <main id="main-content" className="bg-public-paper text-public-ink">
      <div className="mx-auto max-w-7xl px-3 py-4 sm:px-5 lg:px-6">
        <h1 className="sr-only">{t("gamesPage.title")}</h1>

        <GamesDateStrip
          games={allGames.map((game) => ({
            id: game.id,
            href: ROUTES.public.liveGame(game.id),
            date: game.date,
            startTime: game.startTime,
            category: game.category,
            status: game.status,
            home: {
              name: game.homeTeam.name,
              logoUrl: game.homeTeam.logoUrl,
              score: game.homeScore,
            },
            away: {
              name: game.awayTeam.name,
              logoUrl: game.awayTeam.logoUrl,
              score: game.awayScore,
            },
          }))}
          previousLabel={common("actions.previous")}
          nextLabel={common("actions.next")}
        />

        <div className="mt-3 grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex min-w-0 flex-col gap-3">
            {games.live.length > 0 ? (
              <GameGroup
                id="live-games"
                title={t("gamesPage.liveTitle")}
                games={games.live}
                emptyMessage={t("gamesPage.liveEmpty")}
              />
            ) : null}
            <GameGroup
              id="upcoming-games"
              title={t("gamesPage.upcomingTitle")}
              games={games.upcoming}
              emptyMessage={t("gamesPage.upcomingEmpty")}
            />
            <GameGroup
              id="recent-games"
              title={t("gamesPage.recentTitle")}
              games={games.recent}
              emptyMessage={t("gamesPage.recentEmpty")}
            />
          </div>

          <aside className="bg-public-ink p-4 lg:sticky lg:top-20">
            <PublicStandings
              preloadedStandings={preloadedStandings}
              variant="compact"
            />
          </aside>
        </div>
      </div>
    </main>
  );
}
