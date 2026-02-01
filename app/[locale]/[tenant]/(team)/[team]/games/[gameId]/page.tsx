import { TeamGameDetailClient } from "@/components/sections/team/games/team-game-detail-client";
import { preloadQuery, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
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

  const club = await fetchQuery(api.clubs.getBySlug, { slug: team });

  if (!club) {
    notFound();
  }

  const preloadedGame = await preloadQuery(api.games.getById, {
    gameId: gameId as Id<"games">,
  });

  return (
    <TeamGameDetailClient
      preloadedGame={preloadedGame}
      orgSlug={tenant}
      clubSlug={team}
      clubId={club._id}
    />
  );
}
