"use client";

import { Preloaded, usePreloadedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { TeamPlayersTable } from "@/components/sections/shell/teams/soccer/team-settings/team-players-table";

interface LeagueRosterClientProps {
  preloadedPlayers: Preloaded<
    typeof api.players.listSoccerPlayersByLeagueSlug
  >;
  orgSlug: string;
}

export function LeagueRosterClient({
  preloadedPlayers,
  orgSlug,
}: LeagueRosterClientProps) {
  const players = usePreloadedQuery(preloadedPlayers);

  return (
    <div className="p-4 md:p-6 ">
      <TeamPlayersTable
        players={players ?? []}
        orgSlug={orgSlug}
        routeScope="org"
        enableCreate={false}
      />
    </div>
  );
}
