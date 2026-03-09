import { LeagueRosterClient } from "@/components/sections/shell/teams/league-roster-client";
import { preloadQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { getAuthToken } from "@/lib/auth/auth";

interface OrgRosterPageProps {
  params: Promise<{
    tenant: string;
  }>;
}

export default async function OrgRosterPage({ params }: OrgRosterPageProps) {
  const { tenant } = await params;
  const token = await getAuthToken();

  const preloadedPlayers = await preloadQuery(
    api.players.listSoccerPlayersByLeagueSlug,
    {
      leagueSlug: tenant,
    },
    { token },
  );

  return (
    <LeagueRosterClient preloadedPlayers={preloadedPlayers} orgSlug={tenant} />
  );
}
