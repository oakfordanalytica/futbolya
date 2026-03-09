import { PlayerDetailClient } from "@/components/sections/shell/players/player-detail/player-detail-client";
import { preloadQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { getAuthToken } from "@/lib/auth/auth";

interface TeamPlayerDetailPageProps {
  params: Promise<{
    tenant: string;
    teamId: string;
    playerId: string;
  }>;
}

export default async function TeamPlayerDetailPage({
  params,
}: TeamPlayerDetailPageProps) {
  const { tenant, teamId, playerId } = await params;
  const token = await getAuthToken();

  const preloadedPlayer = await preloadQuery(
    api.players.getSoccerPlayerDetailByClubSlug,
    {
      clubSlug: teamId,
      playerId: playerId as Id<"players">,
    },
    { token },
  );

  return (
    <PlayerDetailClient preloadedPlayer={preloadedPlayer} orgSlug={tenant} />
  );
}
