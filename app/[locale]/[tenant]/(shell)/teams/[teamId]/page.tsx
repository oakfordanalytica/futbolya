import { TeamDetailClient } from "@/components/sections/shell/teams/basketball/team-detail/team-detail-client";
import { preloadQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

interface TeamDetailPageProps {
  params: Promise<{
    tenant: string;
    teamId: string;
  }>;
}

export default async function TeamDetailPage({ params }: TeamDetailPageProps) {
  const { tenant, teamId } = await params;
  const preloadedTeam = await preloadQuery(api.clubs.getBySlug, {
    slug: teamId,
  });

  return <TeamDetailClient preloadedTeam={preloadedTeam} orgSlug={tenant} />;
}
