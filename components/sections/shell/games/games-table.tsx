"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Preloaded, usePreloadedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DataTable } from "@/components/table/data-table";
import {
  createGameColumns,
  createGameFilterConfigs,
  type GameRow,
} from "@/components/sections/shell/games/columns";
import { CreateGameDialog } from "@/components/sections/shell/games/create-game-dialog";
import { ROUTES } from "@/lib/navigation/routes";
import { useMatchTimingNow } from "@/hooks/use-match-timing-now";

interface GamesTableProps {
  preloadedGames: Preloaded<typeof api.games.listByLeagueSlug>;
  orgSlug: string;
}

export function GamesTable({ preloadedGames, orgSlug }: GamesTableProps) {
  const router = useRouter();
  const t = useTranslations("Common");
  const data = usePreloadedQuery(preloadedGames);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const nowMs = useMatchTimingNow(data ?? []);

  const handleRowClick = (game: GameRow) => {
    router.push(ROUTES.org.games.detail(orgSlug, game._id));
  };

  const gameColumns = createGameColumns(t, nowMs);
  const gameFilterConfigs = createGameFilterConfigs(t);

  return (
    <div className="p-4 md:p-6 ">
      <DataTable
        columns={gameColumns}
        data={data ?? []}
        filterColumn="search"
        filterPlaceholder={t("games.searchPlaceholder")}
        filterConfigs={gameFilterConfigs}
        emptyMessage={t("games.emptyMessage")}
        columnsMenuLabel={t("table.columns")}
        filtersMenuLabel={t("table.filters")}
        previousLabel={t("actions.previous")}
        nextLabel={t("actions.next")}
        // initialColumnVisibility={{ locationName: false }}
        onCreate={() => setIsCreateOpen(true)}
        onRowClick={handleRowClick}
      />

      <CreateGameDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        orgSlug={orgSlug}
      />
    </div>
  );
}
