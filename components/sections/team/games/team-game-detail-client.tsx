"use client";

import { Preloaded, usePreloadedQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { api } from "@/convex/_generated/api";
import { Heading } from "@/components/ui/heading";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GameHeader } from "@/components/sections/shell/games/game-detail/game-header";
import { GameStatsTable } from "@/components/sections/shell/games/game-detail/game-stats-table";
import { GameSummaryTab } from "@/components/sections/shell/games/game-detail/game-summary-tab";

interface TeamGameDetailClientProps {
  preloadedGame: Preloaded<typeof api.games.getById>;
  orgSlug: string;
  clubSlug: string;
}

export function TeamGameDetailClient({
  preloadedGame,
  orgSlug,
  clubSlug,
}: TeamGameDetailClientProps) {
  const t = useTranslations("Common");
  const game = usePreloadedQuery(preloadedGame);

  if (game === null) {
    return (
      <div className="p-4 md:p-6">
        <Heading>{t("errors.notFound")}</Heading>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full space-y-0 pb-6">
      <GameHeader
        game={game}
        orgSlug={orgSlug}
        routeScope="team"
        currentClubSlug={clubSlug}
      />

      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="w-full justify-start rounded-none py-2.5 bg-muted/50 px-4 md:px-6">
          <TabsTrigger value="summary">{t("games.summary")}</TabsTrigger>
          <TabsTrigger value="stats">{t("games.stats")}</TabsTrigger>
        </TabsList>
        <TabsContent value="summary" className="mt-4 min-w-0 px-4 md:px-6">
          <GameSummaryTab
            game={game}
            orgSlug={orgSlug}
            routeScope="team"
            currentClubSlug={clubSlug}
          />
        </TabsContent>
        <TabsContent value="stats" className="mt-4 min-w-0 px-4 md:px-6">
          <GameStatsTable game={game} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
