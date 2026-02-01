"use client";

import { Preloaded, usePreloadedQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { api } from "@/convex/_generated/api";
import { Heading } from "@/components/ui/heading";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GameHeader } from "@/components/sections/shell/games/game-detail/game-header";
import { GameStatsTable } from "@/components/sections/shell/games/game-detail/game-stats-table";
import { GameBoxScore } from "@/components/sections/shell/games/game-detail/game-box-score";

interface TeamGameDetailClientProps {
  preloadedGame: Preloaded<typeof api.games.getById>;
  orgSlug: string;
  clubSlug: string;
  clubId: string;
}

export function TeamGameDetailClient({
  preloadedGame,
  orgSlug,
  clubSlug,
  clubId,
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
    <div className="space-y-0">
      <GameHeader game={game} orgSlug={orgSlug} />

      <Tabs defaultValue="boxScore" className="w-full">
        <TabsList className="w-full justify-start rounded-none py-2.5 bg-muted/50">
          <TabsTrigger value="boxScore">{t("games.boxScore")}</TabsTrigger>
          <TabsTrigger value="stats">{t("games.stats")}</TabsTrigger>
        </TabsList>
        <TabsContent value="boxScore">
          <GameBoxScore game={game} />
        </TabsContent>
        <TabsContent value="stats">
          <GameStatsTable game={game} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
