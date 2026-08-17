import { useMemo, type CSSProperties, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  FootballLineup,
  FootballLineupPlayer,
} from "@/components/ui/football-field.types";
import { cn } from "@/lib/utils";
import {
  getPlayerEventMarkers,
  getPlayerSubstitutionLinks,
  type MatchLineupsTimelineEvent,
} from "./match-lineups-domain";
import { MatchLineupsTabPanel } from "./match-lineups-tab-panel";
import { MatchLineupsTeamBadge } from "./match-lineups-team-badge";

export type MatchLineupsViewTeam = {
  name: string;
  logoUrl?: string;
  primaryColor?: string;
};

export function MatchLineupsView({
  homeTeam,
  awayTeam,
  homeLineup,
  awayLineup,
  homeFallbackPlayers = [],
  awayFallbackPlayers = [],
  timelineEvents,
  headerAction,
  getPlayerHref,
  className,
}: {
  homeTeam: MatchLineupsViewTeam;
  awayTeam: MatchLineupsViewTeam;
  homeLineup: FootballLineup;
  awayLineup: FootballLineup;
  homeFallbackPlayers?: FootballLineupPlayer[];
  awayFallbackPlayers?: FootballLineupPlayer[];
  timelineEvents: MatchLineupsTimelineEvent[];
  headerAction?: ReactNode;
  getPlayerHref?: (
    side: "home" | "away",
    player: FootballLineupPlayer,
  ) => string | null;
  className?: string;
}) {
  const t = useTranslations("Common");
  const playerEventMarkers = useMemo(
    () => getPlayerEventMarkers(timelineEvents),
    [timelineEvents],
  );
  const homeEvents = useMemo(
    () => timelineEvents.filter((event) => event.side === "home"),
    [timelineEvents],
  );
  const awayEvents = useMemo(
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
  const homeSubstitutions = useMemo(
    () => getPlayerSubstitutionLinks(homeEvents, homeStarterIds),
    [homeEvents, homeStarterIds],
  );
  const awaySubstitutions = useMemo(
    () => getPlayerSubstitutionLinks(awayEvents, awayStarterIds),
    [awayEvents, awayStarterIds],
  );

  const panelLabels = {
    pendingFormationDescription: t("games.lineups.pendingFormationDescription"),
    noLabel: t("games.lineups.number"),
    nameLabel: t("games.lineups.name"),
    substitutesLabel: t("games.lineups.substitutes"),
    emptyLabel: t("games.lineups.empty"),
    substitutedByLabel: t("games.lineups.substitutedBy"),
    enteredForLabel: t("games.lineups.enteredFor"),
  };

  return (
    <Card
      className={cn(
        "w-full max-w-full min-w-0 gap-0 overflow-hidden rounded-xl pt-2 pb-0",
        className,
      )}
    >
      {headerAction ? (
        <CardHeader className="grid-rows-[auto] gap-0 border-b px-3 pt-0 pb-2 md:px-5 [.border-b]:pb-2">
          <CardAction>{headerAction}</CardAction>
        </CardHeader>
      ) : null}
      <CardContent
        className={cn(
          "min-w-0 px-3 py-3 md:px-5 md:py-5",
          headerAction && "pt-2 md:pt-3",
        )}
      >
        <Tabs defaultValue="home" className="w-full min-w-0">
          <TabsList
            className="grid h-auto w-full grid-cols-2 rounded-full border bg-muted/30 px-1 pt-1 pb-0"
            style={{ "--tabs-indicator-bottom": "0px" } as CSSProperties}
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
              getPlayerHref={
                getPlayerHref
                  ? (player) => getPlayerHref("home", player)
                  : undefined
              }
              eventMarkers={playerEventMarkers}
              substitutionData={homeSubstitutions}
              {...panelLabels}
            />
          </TabsContent>
          <TabsContent value="away" className="mt-4 w-full min-w-0">
            <MatchLineupsTabPanel
              lineup={awayLineup}
              fallbackPlayers={awayFallbackPlayers}
              getPlayerHref={
                getPlayerHref
                  ? (player) => getPlayerHref("away", player)
                  : undefined
              }
              eventMarkers={playerEventMarkers}
              substitutionData={awaySubstitutions}
              {...panelLabels}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
