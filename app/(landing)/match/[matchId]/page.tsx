// ################################################################################
// # File: app\(landing)\match\[matchId]\page.tsx                                 #
// # Check: 11/12/2025                                                            #
// ################################################################################

import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { getMatchById } from "@/lib/scoreboard/utils";
import { MatchHeader } from "@/components/sections/match/match-header";
import { MatchLineups } from "@/components/sections/match/match-lineups";
import { MatchTimeline } from "@/components/sections/match/match-timeline";
import { MatchEventSummary } from "@/components/sections/match/match-event-summary";
import { MatchAd } from "@/components/sections/match/match-ad";
import { Separator } from "@/components/ui/separator";

interface MatchPageProps {
  params: {
    matchId: string;
  };
}

export default async function MatchPage(props: MatchPageProps) {
  const params = await props.params;
  const match = await getMatchById(params.matchId);

  if (!match) {
    notFound();
  }

  const getMinute = (minStr: string) => {
    const parts = minStr.split("+");
    return parseInt(parts[0], 10) + (parseInt(parts[1], 10) || 0);
  };
  const sortedEvents = (match.events ?? []).sort(
    (a, b) => getMinute(a.minute) - getMinute(b.minute),
  );

  return (
    <Container className="py-4">
      <MatchHeader match={match} />

      <div className="mt-6 flex flex-col gap-6 lg:flex-row">
        <aside className="lg:w-1/5 order-2 lg:order-1">
          {match.lineups && <MatchLineups lineups={match.lineups} />}
        </aside>

        <main className="flex flex-col gap-6 lg:w-3/5 order-1 lg:order-2">
          <MatchTimeline events={sortedEvents} matchStatus={match.status} />
          <Separator />
          <MatchEventSummary
            events={sortedEvents}
            team1Name={match.team1}
            team2Name={match.team2}
          />
        </main>

        <aside className="hidden lg:block lg:w-1/5 order-3">
          <MatchAd />
        </aside>
      </div>
    </Container>
  );
}