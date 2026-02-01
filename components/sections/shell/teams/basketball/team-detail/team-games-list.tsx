"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DataTable } from "@/components/table/data-table";
import {
  createGameColumns,
  createGameFilterConfigs,
  type GameRow,
} from "@/components/sections/shell/games/columns";
import { TEAM_ROUTES } from "@/lib/navigation/routes";

interface TeamGamesListProps {
  clubSlug: string;
  orgSlug: string;
}

export function TeamGamesList({ clubSlug, orgSlug }: TeamGamesListProps) {
  const router = useRouter();
  const t = useTranslations("Common");
  const games = useQuery(api.games.listByClubSlug, { clubSlug });

  const handleRowClick = (game: GameRow) => {
    router.push(TEAM_ROUTES.games.detail(orgSlug, clubSlug, game._id));
  };

  const gameColumns = createGameColumns(t);
  const gameFilterConfigs = createGameFilterConfigs(t);

  return (
    <DataTable
      columns={gameColumns}
      data={games ?? []}
      filterColumn="search"
      filterPlaceholder={t("games.searchPlaceholder")}
      filterConfigs={gameFilterConfigs}
      emptyMessage={t("games.emptyMessage")}
      columnsMenuLabel={t("table.columns")}
      filtersMenuLabel={t("table.filters")}
      previousLabel={t("actions.previous")}
      nextLabel={t("actions.next")}
      onRowClick={handleRowClick}
    />
  );
}
