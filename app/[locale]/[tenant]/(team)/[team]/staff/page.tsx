import { TeamStaffClient } from "@/components/sections/shell/teams/team-staff-client";
import { preloadQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

type Params = Promise<{
  locale: string;
  tenant: string;
  team: string;
}>;

export default async function TeamStaffPage({ params }: { params: Params }) {
  const { tenant, team } = await params;

  const preloadedStaff = await preloadQuery(api.staff.listAllByClubSlug, {
    clubSlug: team,
  });

  return (
    <TeamStaffClient
      preloadedStaff={preloadedStaff}
      clubSlug={team}
      orgSlug={tenant}
    />
  );
}
