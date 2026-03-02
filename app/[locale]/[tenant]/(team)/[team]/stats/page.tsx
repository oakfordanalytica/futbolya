import { preloadQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { getAuthToken } from "@/lib/auth/auth";
import { SeasonStatsPage } from "@/components/sections/shell/stats/season-stats-page";

type Params = Promise<{
  locale: string;
  tenant: string;
  team: string;
}>;

export default async function TeamStatsPage({ params }: { params: Params }) {
  const { tenant } = await params;
  const token = await getAuthToken();

  const preloadedSeasons = await preloadQuery(
    api.leagueSettings.listSeasons,
    {
      leagueSlug: tenant,
    },
    { token },
  );

  return <SeasonStatsPage preloadedSeasons={preloadedSeasons} orgSlug={tenant} />;
}
