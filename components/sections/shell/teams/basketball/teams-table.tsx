"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Preloaded, usePreloadedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DataTable } from "@/components/table/data-table";
import {
  createBasketballTeamColumns,
  createBasketballTeamFilterConfigs,
  type BasketballTeamRow,
} from "@/components/sections/shell/teams/basketball/teams-columns";
import { CreateTeamDialog } from "@/components/sections/shell/teams/basketball/create-team-dialog";
import { ROUTES } from "@/lib/navigation/routes";

interface BasketballTeamsTableProps {
  preloadedTeams: Preloaded<typeof api.clubs.listByLeague>;
  orgSlug: string;
}

export function BasketballTeamsTable({
  preloadedTeams,
  orgSlug,
}: BasketballTeamsTableProps) {
  const router = useRouter();
  const t = useTranslations("Common");
  const data = usePreloadedQuery(preloadedTeams);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleRowClick = (team: BasketballTeamRow) => {
    if (team.nickname) {
      router.push(ROUTES.org.teams.detail(orgSlug, team.nickname));
    }
  };

  const teamColumns = createBasketballTeamColumns(t);
  const teamFilterConfigs = createBasketballTeamFilterConfigs(t);

  return (
    <>
      <DataTable
        columns={teamColumns}
        data={data ?? []}
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
    </>
  );
}
