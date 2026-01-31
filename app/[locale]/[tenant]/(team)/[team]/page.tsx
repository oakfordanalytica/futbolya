import { TeamDetailClient } from "@/components/sections/shell/teams/basketball/team-detail/team-detail-client";
import { preloadQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

type Params = Promise<{
  locale: string;
  tenant: string;
  team: string;
}>;

export default async function TeamDashboardPage({
  params,
}: {
  params: Params;
}) {
  const { tenant, team } = await params;

  const preloadedTeam = await preloadQuery(api.clubs.getBySlug, {
    slug: team,
  });

  return <TeamDetailClient preloadedTeam={preloadedTeam} orgSlug={tenant} />;
}
