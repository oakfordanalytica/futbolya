"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { GameStatus } from "@/lib/games/status";
import { cn } from "@/lib/utils";
import { GameLineupsDialog } from "./game-lineups-dialog";
import {
  buildDisplayLineup,
  buildFallbackPlayers,
  getPlayerEventMarkers,
  getPlayerSubstitutionLinks,
  type MatchLineupsTimelineEvent,
} from "./match-lineups-domain";
import { MatchLineupsTabPanel } from "./match-lineups-tab-panel";
import { MatchLineupsTeamBadge } from "./match-lineups-team-badge";

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

  const timelineEvents = (timelineData?.events ?? []) as MatchLineupsTimelineEvent[];
  const playerEventMarkers = useMemo(
    () => getPlayerEventMarkers(timelineEvents),
    [timelineEvents],
  );
  const homeTimelineEvents = useMemo(
    () => timelineEvents.filter((event) => event.side === "home"),
    [timelineEvents],
  );
  const awayTimelineEvents = useMemo(
    () => timelineEvents.filter((event) => event.side === "away"),
    [timelineEvents],
  );

  const homeStarterIds = useMemo(
    () => new Set(homeLineup.starters.map((player) => String(player.id))),
    [homeLineup.starters],
  );
  const awayStarterIds = useMemo(
    () => new Set(awayLineup.starters.map((player) => String(player.id))),
    [awayLineup.starters],
  );

  const homeSubstitutionData = useMemo(
    () => getPlayerSubstitutionLinks(homeTimelineEvents, homeStarterIds),
    [homeStarterIds, homeTimelineEvents],
  );
  const awaySubstitutionData = useMemo(
    () => getPlayerSubstitutionLinks(awayTimelineEvents, awayStarterIds),
    [awayStarterIds, awayTimelineEvents],
  );

  const pendingFormationDescription = t(
    "games.lineups.pendingFormationDescription",
  );
  const noLabel = t("games.lineups.number");
  const nameLabel = t("games.lineups.name");
  const substitutesLabel = t("games.lineups.substitutes");
  const emptyLabel = t("games.lineups.empty");
  const substitutedByLabel = t("games.lineups.substitutedBy");
  const enteredForLabel = t("games.lineups.enteredFor");

  return (
    <>
      <Card
        className={cn(
          "w-full max-w-full min-w-0 overflow-hidden gap-0 rounded-xl pt-2 pb-0",
          className,
        )}
      >
        {canEditLineups ? (
          <CardHeader className="grid-rows-[auto] gap-0 border-b px-3 pt-0 pb-2 md:px-5 [.border-b]:pb-2">
            <CardAction>
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
            </CardAction>
          </CardHeader>
        ) : null}
        <CardContent
          className={cn(
            "min-w-0 px-3 py-3 md:px-5 md:py-5",
            canEditLineups && "pt-2 md:pt-3",
          )}
        >
          <Tabs defaultValue="home" className="min-w-0 w-full">
            <TabsList
              className="grid h-auto w-full grid-cols-2 rounded-full border bg-muted/30 px-1 pt-1 pb-0"
              style={
                {
                  "--tabs-indicator-bottom": "0px",
                } as CSSProperties
              }
            >
              <TabsTrigger
                value="home"
                className="mr-0 min-w-0 rounded-full px-2 pt-1.5 pb-2 text-xs sm:px-3 sm:text-sm"
              >
                <MatchLineupsTeamBadge
                  team={homeTeam}
                  label={homeLineup.formation?.trim() || "—"}
                />
              </TabsTrigger>
              <TabsTrigger
                value="away"
                className="mr-0 min-w-0 rounded-full px-2 pt-1.5 pb-2 text-xs sm:px-3 sm:text-sm"
              >
                <MatchLineupsTeamBadge
                  team={awayTeam}
                  label={awayLineup.formation?.trim() || "—"}
                />
              </TabsTrigger>
            </TabsList>

            <TabsContent value="home" className="mt-4 w-full min-w-0">
              <MatchLineupsTabPanel
                lineup={homeLineup}
                fallbackPlayers={homeFallbackPlayers}
                orgSlug={orgSlug}
                routeScope={routeScope}
                currentClubSlug={currentClubSlug}
                teamClubSlug={homeTeam.clubSlug}
                eventMarkers={playerEventMarkers}
                substitutionData={homeSubstitutionData}
                pendingFormationDescription={pendingFormationDescription}
                noLabel={noLabel}
                nameLabel={nameLabel}
                substitutesLabel={substitutesLabel}
                emptyLabel={emptyLabel}
                substitutedByLabel={substitutedByLabel}
                enteredForLabel={enteredForLabel}
              />
            </TabsContent>

            <TabsContent value="away" className="mt-4 w-full min-w-0">
              <MatchLineupsTabPanel
                lineup={awayLineup}
                fallbackPlayers={awayFallbackPlayers}
                orgSlug={orgSlug}
                routeScope={routeScope}
                currentClubSlug={currentClubSlug}
                teamClubSlug={awayTeam.clubSlug}
                eventMarkers={playerEventMarkers}
                substitutionData={awaySubstitutionData}
                pendingFormationDescription={pendingFormationDescription}
                noLabel={noLabel}
                nameLabel={nameLabel}
                substitutesLabel={substitutesLabel}
                emptyLabel={emptyLabel}
                substitutedByLabel={substitutedByLabel}
                enteredForLabel={enteredForLabel}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <GameLineupsDialog
        open={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        gameId={gameId}
      />
    </>
  );
}
