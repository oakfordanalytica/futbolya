import { PlayerDetailClient } from "@/components/sections/shell/players/player-detail/player-detail-client";
import { preloadQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { getAuthToken } from "@/lib/auth/auth";

type Params = Promise<{
  locale: string;
  tenant: string;
  team: string;
  playerId: string;
}>;

export default async function TeamRosterPlayerDetailPage({
  params,
}: {
  params: Params;
}) {
  const { tenant, team, playerId } = await params;
  const token = await getAuthToken();

  const preloadedPlayer = await preloadQuery(
    api.players.getBasketballPlayerDetailByClubSlug,
    {
      clubSlug: team,
      playerId: playerId as Id<"players">,
    },
    { token },
  );

  return (
    <PlayerDetailClient preloadedPlayer={preloadedPlayer} orgSlug={tenant} />
  );
}
