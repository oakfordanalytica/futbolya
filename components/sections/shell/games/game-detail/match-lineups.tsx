"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import type { FootballLineupPlayer } from "@/components/ui/football-field.types";
import type { GameStatus } from "@/lib/games/status";
import { ROUTES, TEAM_ROUTES } from "@/lib/navigation/routes";
import { GameLineupsDialog } from "./game-lineups-dialog";
import {
  buildDisplayLineup,
  buildFallbackPlayers,
  type MatchLineupsTimelineEvent,
} from "./match-lineups-domain";
import { MatchLineupsView } from "./match-lineups-view";

interface MatchLineupsTeam {
  name: string;
  clubSlug: string;
  logoUrl?: string;
  primaryColor?: string;
}

interface MatchLineupsProps {
  gameId: string;
  gameStatus: GameStatus;
  matchStartedAt?: number;
  matchEndedAt?: number;
  orgSlug: string;
  routeScope: "org" | "team";
  currentClubSlug?: string;
  homeTeam: MatchLineupsTeam;
  awayTeam: MatchLineupsTeam;
  className?: string;
}

export function MatchLineups({
  gameId,
  gameStatus,
  matchStartedAt,
  matchEndedAt,
  orgSlug,
  routeScope,
  currentClubSlug,
  homeTeam,
  awayTeam,
  className,
}: MatchLineupsProps) {
  const t = useTranslations("Common");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const gameLineups = useQuery(api.gameLineups.getByGameId, {
    gameId: gameId as Id<"games">,
  });
  const gameStats = useQuery(api.games.getGamePlayerStats, {
    gameId: gameId as Id<"games">,
  });
  const timelineData = useQuery(api.gameEvents.getByGameId, {
    gameId: gameId as Id<"games">,
  });

  const homeLineup = buildDisplayLineup(
    homeTeam.name,
    homeTeam.primaryColor,
    gameLineups?.homeLineup,
    gameStats?.homeStats ?? [],
  );
  const awayLineup = buildDisplayLineup(
    awayTeam.name,
    awayTeam.primaryColor,
    gameLineups?.awayLineup,
    gameStats?.awayStats ?? [],
  );
  const homeFallbackPlayers = useMemo(
    () => buildFallbackPlayers(gameStats?.homeStats ?? []),
    [gameStats?.homeStats],
  );
  const awayFallbackPlayers = useMemo(
    () => buildFallbackPlayers(gameStats?.awayStats ?? []),
    [gameStats?.awayStats],
  );
  const canEditLineups =
    Boolean(gameLineups?.canEditHome) || Boolean(gameLineups?.canEditAway);
  const areLineupsLocked =
    Boolean(matchStartedAt) ||
    Boolean(matchEndedAt) ||
    gameStatus !== "scheduled";

  const getPlayerHref = (
    side: "home" | "away",
    player: FootballLineupPlayer,
  ) => {
    const teamSlug = side === "home" ? homeTeam.clubSlug : awayTeam.clubSlug;
    if (routeScope === "org") {
      return ROUTES.org.teams.playerDetail(
        orgSlug,
        teamSlug,
        String(player.id),
      );
    }
    return currentClubSlug === teamSlug
      ? TEAM_ROUTES.rosterPlayerDetail(orgSlug, teamSlug, String(player.id))
      : null;
  };

  return (
    <>
      <MatchLineupsView
        className={className}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        homeLineup={homeLineup}
        awayLineup={awayLineup}
        homeFallbackPlayers={homeFallbackPlayers}
        awayFallbackPlayers={awayFallbackPlayers}
        timelineEvents={
          (timelineData?.events ?? []) as MatchLineupsTimelineEvent[]
        }
        getPlayerHref={getPlayerHref}
        headerAction={
          canEditLineups ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 max-w-full px-2 text-[11px] sm:px-2.5 sm:text-xs"
              onClick={() => setIsEditorOpen(true)}
              disabled={areLineupsLocked}
            >
              <span className="sm:hidden">
                {t("games.lineups.configureShort")}
              </span>
              <span className="hidden sm:inline">
                {t("games.lineups.configure")}
              </span>
            </Button>
          ) : undefined
        }
      />
      <GameLineupsDialog
        open={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        gameId={gameId}
      />
    </>
  );
}
