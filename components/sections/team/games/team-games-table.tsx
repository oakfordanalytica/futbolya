"use client";

import { useMemo, useState } from "react";
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
import { useIsAdmin } from "@/hooks/use-is-admin";
import { TEAM_ROUTES } from "@/lib/navigation/routes";
import { useMatchTimingNow } from "@/hooks/use-match-timing-now";

interface TeamGamesTableProps {
  preloadedGames: Preloaded<typeof api.games.listByClubSlug>;
  orgSlug: string;
  clubSlug: string;
  clubId: string;
}

export function TeamGamesTable({
  preloadedGames,
  orgSlug,
  clubSlug,
  clubId,
}: TeamGamesTableProps) {
  const router = useRouter();
  const t = useTranslations("Common");
  const data = usePreloadedQuery(preloadedGames);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { isAdmin, isLoaded } = useIsAdmin();
  const nowMs = useMatchTimingNow(data ?? []);

  const handleRowClick = (game: GameRow) => {
    router.push(TEAM_ROUTES.games.detail(orgSlug, clubSlug, game._id));
  };

  const gameColumns = useMemo(() => createGameColumns(t, nowMs), [t, nowMs]);
  const gameFilterConfigs = useMemo(
    () => createGameFilterConfigs(t, data ?? []),
    [data, t],
  );

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
        onCreate={isLoaded && isAdmin ? () => setIsCreateOpen(true) : undefined}
        onRowClick={handleRowClick}
      />

      {isLoaded && isAdmin ? (
        <CreateGameDialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          orgSlug={orgSlug}
          preselectedClubId={clubId}
        />
      ) : null}
    </div>
  );
}
