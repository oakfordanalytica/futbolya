"use client";

import { Preloaded, usePreloadedQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { api } from "@/convex/_generated/api";
import { Heading } from "@/components/ui/heading";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GameHeader } from "./game-header";
import { GameStatsTable } from "./game-stats-table";
import { GameSummaryTab } from "./game-summary-tab";

interface GameDetailClientProps {
  preloadedGame: Preloaded<typeof api.games.getById>;
  orgSlug: string;
}

export function GameDetailClient({
  preloadedGame,
  orgSlug,
}: GameDetailClientProps) {
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
      <GameHeader game={game} orgSlug={orgSlug} routeScope="org" />
      <Tabs defaultValue="summary" className="w-full">
        <div className="w-full overflow-x-auto overflow-y-hidden bg-muted/50 shadow-xs">
          <TabsList className="inline-flex min-w-max flex-nowrap justify-start rounded-none px-4 py-2.5 md:px-6">
            <TabsTrigger value="summary" className="flex-none shrink-0">
              {t("games.summary")}
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex-none shrink-0">
              {t("games.stats")}
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="summary" className="mt-4 min-w-0 px-4 md:px-6">
          <GameSummaryTab game={game} orgSlug={orgSlug} routeScope="org" />
        </TabsContent>
        <TabsContent value="stats" className="mt-4 min-w-0 px-4 md:px-6">
          <GameStatsTable game={game} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
