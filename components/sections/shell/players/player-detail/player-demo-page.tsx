"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { DataTable } from "@/components/table/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { COMPACT_STATS_TABLE_CLASS } from "@/components/sections/shell/stats/stats-columns";
import { darkenHex } from "@/lib/utils";
import { PlayerHighlightsStrip } from "./player-highlights-strip";
import {
  createPlayerGameLogColumns,
  PlayerRecentStatsPreview,
  type PlayerGameLogRow,
} from "./player-recent-stats";
import { PlayerProfileHeader } from "./player-profile-header";

interface PlayerDemoPageProps {
  orgSlug: string;
}

const DEMO_PLAYER = {
  firstName: "Sebastián",
  lastName: "Duque",
  secondLastName: "Agudelo",
  photoUrl: "/background-auth.jpg",
  dateOfBirth: "2002-09-02",
  cometNumber: "CMT-0000",
  height: 172,
  weight: 69,
  country: "co",
  categoryName: "Sub-23",
  clubName: "FutbolYa FC",
  clubSlug: "futbolya-fc",
  clubPrimaryColor: "#1b2a41",
  goals: 8,
  yellowCards: 3,
  redCards: 1,
  penaltiesScored: 2,
  gamesPlayed: 14,
} as const;

const DEMO_HIGHLIGHTS = [
  {
    id: "demo-1",
    title: "Resumen de goles y jugadas",
    url: "https://www.youtube.com/watch?v=Z4jQvWl7Y6Q",
    videoId: "Z4jQvWl7Y6Q",
  },
];

const DEMO_BIO = {
  title: "Trayectoria",
  content:
    "Perfil demo para validar la nueva versión de fútbol del detalle de jugador. Esta vista sirve para revisar highlights, bio y el game log ya modelado con goles, tarjetas y penales.",
};

const DEMO_GAME_LOG: PlayerGameLogRow[] = [
  {
    gameId: "demo-game-1",
    date: "2026-03-01",
    startTime: "19:00",
    gameType: "season",
    teamName: "FutbolYa FC",
    teamNickname: "FYA",
    opponentName: "Academia Norte",
    opponentNickname: "ANR",
    result: "W",
    teamScore: 2,
    opponentScore: 0,
    goals: 1,
    yellowCards: 0,
    redCards: 0,
    penaltiesScored: 0,
  },
  {
    gameId: "demo-game-2",
    date: "2026-02-24",
    startTime: "16:30",
    gameType: "season",
    teamName: "FutbolYa FC",
    teamNickname: "FYA",
    opponentName: "Cali United",
    opponentNickname: "CAL",
    result: "L",
    teamScore: 1,
    opponentScore: 2,
    goals: 0,
    yellowCards: 1,
    redCards: 0,
    penaltiesScored: 0,
  },
  {
    gameId: "demo-game-3",
    date: "2026-02-18",
    startTime: "20:00",
    gameType: "quick",
    teamName: "FutbolYa FC",
    teamNickname: "FYA",
    opponentName: "Deportivo Sur",
    opponentNickname: "SUR",
    result: "W",
    teamScore: 3,
    opponentScore: 1,
    goals: 2,
    yellowCards: 0,
    redCards: 0,
    penaltiesScored: 1,
  },
  {
    gameId: "demo-game-4",
    date: "2026-02-12",
    startTime: "18:15",
    gameType: "season",
    teamName: "FutbolYa FC",
    teamNickname: "FYA",
    opponentName: "Atlético Centro",
    opponentNickname: "ATC",
    result: "—",
    teamScore: 1,
    opponentScore: 1,
    goals: 0,
    yellowCards: 1,
    redCards: 0,
    penaltiesScored: 0,
  },
  {
    gameId: "demo-game-5",
    date: "2026-02-07",
    startTime: "17:00",
    gameType: "season",
    teamName: "FutbolYa FC",
    teamNickname: "FYA",
    opponentName: "Juventud Bogotá",
    opponentNickname: "JBO",
    result: "W",
    teamScore: 1,
    opponentScore: 0,
    goals: 1,
    yellowCards: 0,
    redCards: 0,
    penaltiesScored: 0,
  },
];

export function PlayerDemoPage({ orgSlug }: PlayerDemoPageProps) {
  const locale = useLocale();
  const t = useTranslations("Common");
  const darkerColor = darkenHex(DEMO_PLAYER.clubPrimaryColor, 0.2);

  const gameLogColumns = useMemo(
    () => createPlayerGameLogColumns(t, locale),
    [locale, t],
  );

  return (
    <div className="space-y-0">
      <PlayerProfileHeader
        player={DEMO_PLAYER}
        orgSlug={orgSlug}
        positionName="Delantero"
        statsBackgroundColor={darkerColor}
      />

      <Tabs defaultValue="profile" className="w-full">
        <TabsList
          className="w-full justify-start rounded-none px-4 py-2.5 shadow-xs md:px-6"
          style={{ backgroundColor: darkerColor }}
        >
          <TabsTrigger value="profile" style={{ color: "white" }}>
            {t("players.profile")}
          </TabsTrigger>
          <TabsTrigger value="stats" style={{ color: "white" }}>
            {t("games.stats")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-0 px-4 py-4 md:px-6">
          <div className="space-y-4">
            <PlayerHighlightsStrip
              highlights={DEMO_HIGHLIGHTS}
              canManage={false}
              onAdd={() => undefined}
            />

            <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              <section className="order-2 rounded-md border bg-card p-4 xl:order-1">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {DEMO_BIO.title}
                </h2>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {DEMO_BIO.content}
                </p>
              </section>

              <PlayerRecentStatsPreview
                className="order-1 xl:order-2"
                rows={DEMO_GAME_LOG}
                isLoading={false}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="stats" className="mt-0 px-4 py-4 md:px-6">
          <div className={COMPACT_STATS_TABLE_CLASS}>
            <DataTable
              columns={gameLogColumns}
              data={DEMO_GAME_LOG}
              filterColumn="search"
              filterPlaceholder={t("players.statsSearchPlaceholder")}
              emptyMessage={t("players.statsEmpty")}
              columnsMenuLabel={t("table.columns")}
              filtersMenuLabel={t("table.filters")}
              previousLabel={t("actions.previous")}
              nextLabel={t("actions.next")}
              initialSorting={[{ id: "date", desc: true }]}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
