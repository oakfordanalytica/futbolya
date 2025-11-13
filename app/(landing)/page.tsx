// ################################################################################
// # File: app\(landing)\page.tsx                                                 #
// # Check: 11/11/2025                                                            #
// ################################################################################

import type { Metadata } from "next";
import { landingMetadata } from "@/lib/seo/landing";
import { Container } from "@/components/ui/container";
import { PinnedLeagues } from "@/components/sections/landing/pinned-leagues";
import { Scoreboard } from "@/components/sections/landing/scoreboard";
// TODO: This will be replaced by convex. EG:
// import { useQuery } from "convex/react";
// import { api } from "../convex/_generated/api";
import { getScoreboardData } from "@/lib/scoreboard/utils";

export const metadata: Metadata = landingMetadata;

export default async function Home() {
  // TODO: This will be replaced by convex. EG:
  // const tasks = useQuery(api.tasks.get);
  const {
    leagues: scoreboardLeagues,
    matches: scoreboardMatches,
    pinnedLeagues,
  } = await getScoreboardData();

  return (
    <Container className="grid gap-8 py-4 grid-cols-1 lg:grid-cols-5">
      <aside className="hidden lg:block">
        <PinnedLeagues leagues={pinnedLeagues} />
      </aside>
      <main className="lg:col-start-2 lg:-col-end-1">
        <Scoreboard leagues={scoreboardLeagues} matches={scoreboardMatches} />
      </main>
    </Container>
  );
}
