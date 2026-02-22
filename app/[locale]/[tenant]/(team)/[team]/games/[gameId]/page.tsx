import { TeamGameDetailClient } from "@/components/sections/team/games/team-game-detail-client";
import { preloadQuery, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { getAuthToken } from "@/lib/auth/auth";
import { notFound } from "next/navigation";

type Params = Promise<{
  locale: string;
  tenant: string;
  team: string;
  gameId: string;
}>;

export default async function TeamGameDetailPage({
  params,
}: {
  params: Params;
}) {
  const { tenant, team, gameId } = await params;
  const token = await getAuthToken();

  const club = await fetchQuery(api.clubs.getBySlug, { slug: team }, { token });

  if (!club) {
    notFound();
  }

  const preloadedGame = await preloadQuery(
    api.games.getById,
    {
      gameId: gameId as Id<"games">,
    },
    { token },
  );

  return (
    <TeamGameDetailClient
      preloadedGame={preloadedGame}
      orgSlug={tenant}
      clubSlug={team}
      clubId={club._id}
    />
  );
}
