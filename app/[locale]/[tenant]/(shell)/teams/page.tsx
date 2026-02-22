import { BasketballTeamsTable } from "@/components/sections/shell/teams/basketball/teams-table";
import { preloadQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { getAuthToken } from "@/lib/auth/auth";

interface TeamsPageProps {
  params: Promise<{
    tenant: string;
  }>;
}

export default async function TeamsPage({ params }: TeamsPageProps) {
  // Explore the possibility of using the provider instead of passing the tenant directly
  const { tenant } = await params;
  const token = await getAuthToken();

  // TODO: Replace with actual sportType detection from league data
  const sportType = "basketball";

  if (sportType === "basketball") {
    const preloadedTeams = await preloadQuery(
      api.clubs.listByLeague,
      {
        orgSlug: tenant,
      },
      { token },
    );
    return (
      <BasketballTeamsTable preloadedTeams={preloadedTeams} orgSlug={tenant} />
    );
  }

  return <div>Unsupported sport type</div>;
}
