import { SoccerTeamsTable } from "@/components/sections/shell/teams/soccer/teams-table";
import { preloadQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { getAuthToken } from "@/lib/auth/auth";

interface TeamsPageProps {
  params: Promise<{
    tenant: string;
  }>;
}

export default async function TeamsPage({ params }: TeamsPageProps) {
  const { tenant } = await params;
  const token = await getAuthToken();

  const [preloadedTeams, preloadedGames] = await Promise.all([
    preloadQuery(
      api.clubs.listByLeague,
      {
        orgSlug: tenant,
      },
      { token },
    ),
    preloadQuery(
      api.games.listByLeagueSlug,
      {
        orgSlug: tenant,
      },
      { token },
    ),
  ]);

  return (
    <SoccerTeamsTable
      preloadedTeams={preloadedTeams}
      preloadedGames={preloadedGames}
      orgSlug={tenant}
    />
  );
}
