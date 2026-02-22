import { GameDetailClient } from "@/components/sections/shell/games/game-detail/game-detail-client";
import { preloadQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { getAuthToken } from "@/lib/auth/auth";

interface GameDetailPageProps {
  params: Promise<{
    tenant: string;
    gameId: string;
  }>;
}

export default async function GameDetailPage({ params }: GameDetailPageProps) {
  const { tenant, gameId } = await params;
  const token = await getAuthToken();

  const preloadedGame = await preloadQuery(
    api.games.getById,
    {
      gameId: gameId as Id<"games">,
    },
    { token },
  );

  return <GameDetailClient preloadedGame={preloadedGame} orgSlug={tenant} />;
}
