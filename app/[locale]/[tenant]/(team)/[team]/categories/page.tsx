import { TeamCategoriesClient } from "@/components/sections/shell/teams/team-categories-client";
import { preloadQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

type Params = Promise<{
  locale: string;
  tenant: string;
  team: string;
}>;

export default async function TeamCategoriesPage({
  params,
}: {
  params: Params;
}) {
  const { tenant, team } = await params;

  const preloadedCategories = await preloadQuery(
    api.categories.listByClubSlugWithPlayerCount,
    {
      clubSlug: team,
    },
  );

  return (
    <TeamCategoriesClient
      preloadedCategories={preloadedCategories}
      clubSlug={team}
      orgSlug={tenant}
    />
  );
}
