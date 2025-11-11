import type { Metadata } from "next";
import { landingMetadata } from "@/lib/seo/landing";
import { Container } from "@/components/sections/landing/container";
import { PinnedLeagues } from "@/components/sections/landing/pinned-leagues";
import { Scoreboard } from "@/components/sections/landing/scoreboard";

// TODO: This component will be replaced by convex, Eg:
// import { useQuery, useMutation } from "convex/react";
import { getScoreboardData } from "@/lib/scoreboard/utils";

export const metadata: Metadata = landingMetadata;

export default async function Home() {
  // TODO: This will be replaced by convex. Eg:
  // const {leagues, matches, pinnedLeagues} = useQuery(api.scoreboard.get);
  const {
    leagues: scoreboardLeagues,
    matches: scoreboardMatches,
    pinnedLeagues,
  } = await getScoreboardData();

  return (
    <Container className="flex pt-8 gap-8 w-full">
      <main className="flex flex-col gap-4 w-full max-w-4xl">
        <Scoreboard leagues={scoreboardLeagues} matches={scoreboardMatches} />
      </main>
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-8">
          <PinnedLeagues leagues={pinnedLeagues} />
        </div>
      </aside>
    </Container>
  );
}
