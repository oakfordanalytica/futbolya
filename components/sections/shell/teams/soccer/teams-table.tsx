"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Preloaded, usePreloadedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DataTable } from "@/components/table/data-table";
import {
  createSoccerTeamColumns,
  createSoccerTeamFilterConfigs,
  type SoccerTeamRow,
} from "@/components/sections/shell/teams/soccer/teams-columns";
import { CreateTeamDialog } from "@/components/sections/shell/teams/soccer/create-team-dialog";
import { TeamsGamesWeekStrip } from "@/components/sections/shell/teams/soccer/teams-games-week-strip";
import { ROUTES } from "@/lib/navigation/routes";

interface SoccerTeamsTableProps {
  preloadedTeams: Preloaded<typeof api.clubs.listByLeague>;
  preloadedGames: Preloaded<typeof api.games.listByLeagueSlug>;
  orgSlug: string;
}

export function SoccerTeamsTable({
  preloadedTeams,
  preloadedGames,
  orgSlug,
}: SoccerTeamsTableProps) {
  const router = useRouter();
  const t = useTranslations("Common");
  const teams = usePreloadedQuery(preloadedTeams);
  const games = usePreloadedQuery(preloadedGames);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleRowClick = (team: SoccerTeamRow) => {
    if (team.nickname) {
      router.push(ROUTES.org.teams.detail(orgSlug, team.nickname));
    }
  };

  const teamColumns = createSoccerTeamColumns(t);
  const teamFilterConfigs = createSoccerTeamFilterConfigs(t);

  return (
    <div className="space-y-4 p-4 md:p-6">
      <TeamsGamesWeekStrip games={games ?? []} orgSlug={orgSlug} />

      <DataTable
        columns={teamColumns}
        data={teams ?? []}
        filterColumn="search"
        filterPlaceholder={t("teams.searchPlaceholder")}
        filterConfigs={teamFilterConfigs}
        emptyMessage={t("teams.emptyMessage")}
        columnsMenuLabel={t("table.columns")}
        filtersMenuLabel={t("table.filters")}
        previousLabel={t("actions.previous")}
        nextLabel={t("actions.next")}
        onCreate={() => setIsCreateOpen(true)}
        onRowClick={handleRowClick}
      />

      <CreateTeamDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        orgSlug={orgSlug}
      />
    </div>
  );
}
