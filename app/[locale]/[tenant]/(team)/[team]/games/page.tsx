import { TeamGamesTable } from "@/components/sections/team/games/team-games-table";
import { preloadQuery, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { notFound } from "next/navigation";

type Params = Promise<{
  locale: string;
  tenant: string;
  team: string;
}>;

export default async function TeamGamesPage({ params }: { params: Params }) {
  const { tenant, team } = await params;

  const club = await fetchQuery(api.clubs.getBySlug, { slug: team });

  if (!club) {
    notFound();
  }

  const preloadedGames = await preloadQuery(api.games.listByClubSlug, {
    clubSlug: team,
  });

  return (
    <TeamGamesTable
      preloadedGames={preloadedGames}
      orgSlug={tenant}
      clubSlug={team}
      clubId={club._id}
    />
  );
}
