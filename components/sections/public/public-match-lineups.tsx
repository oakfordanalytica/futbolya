"use client";

import { MatchLineupsView } from "@/components/sections/shell/games/game-detail/match-lineups-view";
import {
  buildDisplayLineup,
  type MatchLineupsTimelineEvent,
} from "@/components/sections/shell/games/game-detail/match-lineups-domain";

interface PublicLineupPlayer {
  playerId: string;
  playerName: string;
  lastName: string;
  jerseyNumber?: number;
  photoUrl?: string;
  position?: string;
}

interface PublicLineup {
  formation?: string;
  slots: Array<{
    id: string;
    x: number;
    y: number;
    role: "goalkeeper" | "outfield";
    player?: PublicLineupPlayer;
  }>;
  starters: PublicLineupPlayer[];
  substitutes: PublicLineupPlayer[];
}

export function PublicMatchLineups({
  homeTeam,
  awayTeam,
  lineups,
  events,
  className,
}: {
  homeTeam: { name: string; logoUrl?: string; color?: string };
  awayTeam: { name: string; logoUrl?: string; color?: string };
  lineups: { home: PublicLineup; away: PublicLineup };
  className?: string;
  events: Array<{
    sequence: number;
    side: "home" | "away";
    type: MatchLineupsTimelineEvent["type"];
    playerId?: string;
    relatedPlayerId?: string;
  }>;
}) {
  const homeLineup = buildDisplayLineup(
    homeTeam.name,
    homeTeam.color,
    lineups.home,
    [],
  );
  const awayLineup = buildDisplayLineup(
    awayTeam.name,
    awayTeam.color,
    lineups.away,
    [],
  );
  const timelineEvents = events.flatMap<MatchLineupsTimelineEvent>((event) =>
    event.playerId
      ? [
          {
            id: String(event.sequence),
            side: event.side,
            type: event.type,
            playerId: event.playerId,
            relatedPlayerId: event.relatedPlayerId,
          },
        ]
      : [],
  );

  return (
    <MatchLineupsView
      homeTeam={{
        name: homeTeam.name,
        logoUrl: homeTeam.logoUrl,
        primaryColor: homeTeam.color,
      }}
      awayTeam={{
        name: awayTeam.name,
        logoUrl: awayTeam.logoUrl,
        primaryColor: awayTeam.color,
      }}
      homeLineup={homeLineup}
      awayLineup={awayLineup}
      timelineEvents={timelineEvents}
      className={className}
    />
  );
}
