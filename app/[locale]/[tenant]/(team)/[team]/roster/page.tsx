import { TeamRosterClient } from "@/components/sections/shell/teams/team-roster-client";
import { preloadQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { getAuthToken } from "@/lib/auth/auth";

type Params = Promise<{
  locale: string;
  tenant: string;
  team: string;
}>;

export default async function TeamRosterPage({ params }: { params: Params }) {
  const { tenant, team } = await params;
  const token = await getAuthToken();

  const preloadedPlayers = await preloadQuery(
    api.players.listSoccerPlayersByClubSlug,
    {
      clubSlug: team,
    },
    { token },
  );

  return (
    <TeamRosterClient
      preloadedPlayers={preloadedPlayers}
      clubSlug={team}
      orgSlug={tenant}
    />
  );
}
