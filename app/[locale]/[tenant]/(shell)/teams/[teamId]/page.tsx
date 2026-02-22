import { TeamDetailClient } from "@/components/sections/shell/teams/basketball/team-detail/team-detail-client";
import { preloadQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { getAuthToken } from "@/lib/auth/auth";

interface TeamDetailPageProps {
  params: Promise<{
    tenant: string;
    teamId: string;
  }>;
}

export default async function TeamDetailPage({ params }: TeamDetailPageProps) {
  const { tenant, teamId } = await params;
  const token = await getAuthToken();

  const preloadedTeam = await preloadQuery(
    api.clubs.getBySlug,
    {
      slug: teamId,
    },
    { token },
  );

  return (
    <TeamDetailClient
      preloadedTeam={preloadedTeam}
      orgSlug={tenant}
      routeScope="org"
    />
  );
}
