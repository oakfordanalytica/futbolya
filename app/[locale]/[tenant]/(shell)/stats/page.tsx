import { preloadQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { getAuthToken } from "@/lib/auth/auth";
import { SeasonStatsPage } from "@/components/sections/shell/stats/season-stats-page";

interface StatsPageProps {
  params: Promise<{
    tenant: string;
  }>;
}

export default async function StatsPage({ params }: StatsPageProps) {
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
