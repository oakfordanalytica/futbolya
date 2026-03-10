"use client";

import { GameBoxScore } from "./game-box-score";
import { MatchLineups } from "./match-lineups";
import { MatchTimeline } from "./match-timeline";

interface GameSummaryTabProps {
  orgSlug: string;
  routeScope: "org" | "team";
  currentClubSlug?: string;
  game: {
    _id: string;
    homeTeamName: string;
    awayTeamName: string;
    homeClubSlug: string;
    awayClubSlug: string;
    homeTeamLogo?: string;
    awayTeamLogo?: string;
    homeTeamColor?: string;
    awayTeamColor?: string;
  };
}

export function GameSummaryTab({
  game,
  orgSlug,
  routeScope,
  currentClubSlug,
}: GameSummaryTabProps) {
  return (
    <div className="w-full min-w-0 max-w-full space-y-6">
      <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)] xl:items-start">
        <MatchLineups
          className="min-w-0 xl:row-span-2"
          gameId={game._id}
          orgSlug={orgSlug}
          routeScope={routeScope}
          currentClubSlug={currentClubSlug}
          homeTeam={{
            name: game.homeTeamName,
            clubSlug: game.homeClubSlug,
            logoUrl: game.homeTeamLogo,
            primaryColor: game.homeTeamColor,
          }}
          awayTeam={{
            name: game.awayTeamName,
            clubSlug: game.awayClubSlug,
            logoUrl: game.awayTeamLogo,
            primaryColor: game.awayTeamColor,
          }}
        />

        <MatchTimeline
          homeTeam={{
            name: game.homeTeamName,
            logoUrl: game.homeTeamLogo,
          }}
          awayTeam={{
            name: game.awayTeamName,
            logoUrl: game.awayTeamLogo,
          }}
          events={[]}
        />

        <GameBoxScore game={game} />
      </div>
    </div>
  );
}
