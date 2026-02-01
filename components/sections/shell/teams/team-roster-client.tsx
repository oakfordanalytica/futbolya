"use client";

import { Preloaded, usePreloadedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { TeamPlayersTable } from "@/components/sections/shell/teams/basketball/team-settings/team-players-table";

interface TeamRosterClientProps {
  preloadedPlayers: Preloaded<
    typeof api.players.listBasketballPlayersByClubSlug
  >;
  clubSlug: string;
  orgSlug: string;
}

export function TeamRosterClient({
  preloadedPlayers,
  clubSlug,
  orgSlug,
}: TeamRosterClientProps) {
  const players = usePreloadedQuery(preloadedPlayers);

  return (
    <div className="p-4 md:p-6 ">
      <TeamPlayersTable
        players={players ?? []}
        clubSlug={clubSlug}
        orgSlug={orgSlug}
      />
    </div>
  );
}
