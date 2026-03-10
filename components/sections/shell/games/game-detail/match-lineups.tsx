"use client";

import { useMemo, useState, type CSSProperties } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useQuery } from "convex/react";
import { useRouter } from "@/i18n/navigation";
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
import { FootballField } from "@/components/ui/football-field";
import type {
  FootballLineup,
  FootballLineupPlayer,
  FootballLineupSlot,
} from "@/components/ui/football-field.types";
import { ROUTES, TEAM_ROUTES } from "@/lib/navigation/routes";
import { cn } from "@/lib/utils";
import { GameLineupsDialog } from "./game-lineups-dialog";

interface MatchLineupsTeam {
  name: string;
  clubSlug: string;
  logoUrl?: string;
  primaryColor?: string;
}

interface MatchLineupsProps {
  gameId: string;
  gameStatus:
    | "scheduled"
    | "in_progress"
    | "halftime"
    | "awaiting_stats"
    | "pending_review"
    | "completed"
    | "cancelled";
  matchStartedAt?: number;
  matchEndedAt?: number;
  orgSlug: string;
  routeScope: "org" | "team";
  currentClubSlug?: string;
  homeTeam: MatchLineupsTeam;
  awayTeam: MatchLineupsTeam;
  className?: string;
}

type GamePlayerStat = {
  _id: string;
  playerId: string;
  playerName: string;
  jerseyNumber?: number;
  cometNumber?: string;
  isStarter: boolean;
};

type GameTimelineEvent = {
  id: string;
  type:
    | "goal"
    | "yellow_card"
    | "red_card"
    | "substitution"
    | "penalty_scored"
    | "penalty_missed";
  playerId: string;
  relatedPlayerId?: string;
};

type PlayerSubstitutionLink = {
  outgoingPlayerId: string;
  incomingPlayerId: string;
};

type PersistedLineupPlayer = {
  playerId: string;
  playerName: string;
  lastName: string;
  photoUrl?: string;
  jerseyNumber?: number;
  cometNumber?: string;
  position?: string;
};

type PersistedLineupSlot = {
  id: string;
  x: number;
  y: number;
  role: "goalkeeper" | "outfield";
  player?: PersistedLineupPlayer;
};

type PersistedLineup = {
  lineupTemplateId?: string;
  formation?: string;
  slots: PersistedLineupSlot[];
  starters: PersistedLineupPlayer[];
  substitutes: PersistedLineupPlayer[];
};

function mapStatToLineupPlayer(stat: GamePlayerStat): FootballLineupPlayer {
  return {
    id: stat.playerId,
    name: stat.playerName,
    number: stat.jerseyNumber !== undefined ? `${stat.jerseyNumber}` : "—",
  };
}

function mapPersistedToLineupPlayer(
  player: PersistedLineupPlayer,
): FootballLineupPlayer {
  return {
    id: player.playerId,
    name: player.playerName,
    lastName: player.lastName,
    photoUrl: player.photoUrl,
    number: player.jerseyNumber !== undefined ? `${player.jerseyNumber}` : "—",
    position: player.position,
  };
}

function clonePlayerWithSubstitutionLines(
  player: FootballLineupPlayer,
  substitutionsByOutgoingPlayer: Map<string, PlayerSubstitutionLink[]>,
  substitutionsByIncomingPlayer: Map<string, PlayerSubstitutionLink[]>,
  playersById: Map<string, FootballLineupPlayer>,
  substitutedByLabel: string,
  enteredForLabel: string,
): FootballLineupPlayer {
  const outgoingLinks =
    substitutionsByOutgoingPlayer.get(String(player.id)) ?? [];
  const incomingLinks =
    substitutionsByIncomingPlayer.get(String(player.id)) ?? [];

  const substitutionTooltipLines = [
    ...outgoingLinks
      .map((link) => playersById.get(link.incomingPlayerId))
      .filter((incomingPlayer): incomingPlayer is FootballLineupPlayer =>
        Boolean(incomingPlayer),
      )
      .map((incomingPlayer) => `${substitutedByLabel}: ${incomingPlayer.name}`),
    ...incomingLinks
      .map((link) => playersById.get(link.outgoingPlayerId))
      .filter((outgoingPlayer): outgoingPlayer is FootballLineupPlayer =>
        Boolean(outgoingPlayer),
      )
      .map((outgoingPlayer) => `${enteredForLabel}: ${outgoingPlayer.name}`),
  ];

  if (substitutionTooltipLines.length === 0) {
    return player;
  }

  return {
    ...player,
    substitutionTooltipLines,
  };
}

function buildLineup(
  teamName: string,
  teamColor: string | undefined,
  stats: GamePlayerStat[],
): FootballLineup {
  const starters = stats
    .filter((stat) => stat.isStarter)
    .map(mapStatToLineupPlayer);
  const substitutes = stats
    .filter((stat) => !stat.isStarter)
    .map(mapStatToLineupPlayer);

  return {
    teamName,
    teamColor,
    starters,
    substitutes,
  };
}

function buildPersistedLineup(
  teamName: string,
  teamColor: string | undefined,
  lineup: PersistedLineup,
): FootballLineup {
  return {
    teamName,
    teamColor,
    formation: lineup.formation,
    slots: lineup.slots.map<FootballLineupSlot>((slot) => ({
      id: slot.id,
      x: slot.x,
      y: slot.y,
      role: slot.role,
      ...(slot.player
        ? { player: mapPersistedToLineupPlayer(slot.player) }
        : {}),
    })),
    starters: lineup.starters.map(mapPersistedToLineupPlayer),
    substitutes: lineup.substitutes.map(mapPersistedToLineupPlayer),
  };
}

function buildDisplayLineup(
  teamName: string,
  teamColor: string | undefined,
  lineup: PersistedLineup | null | undefined,
  stats: GamePlayerStat[],
) {
  if (lineup) {
    return buildPersistedLineup(teamName, teamColor, lineup);
  }

  return buildLineup(teamName, teamColor, stats);
}

function TeamBadge({ team, label }: { team: MatchLineupsTeam; label: string }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
      {team.logoUrl ? (
        <Image
          src={team.logoUrl}
          alt={team.name}
          width={18}
          height={18}
          className="size-4 object-contain sm:size-[18px]"
        />
      ) : (
        <div className="flex size-4 items-center justify-center rounded-full bg-muted text-[9px] font-bold text-muted-foreground sm:size-[18px] sm:text-[10px]">
          {team.name.charAt(0).toUpperCase()}
        </div>
      )}
      <span className="truncate text-xs font-semibold sm:text-sm">{label}</span>
    </div>
  );
}

function FieldPlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div
      className={cn(
        "relative aspect-[2/3] w-full overflow-hidden rounded-lg border-2 border-white/40",
        "bg-gradient-to-b from-green-500 to-green-600 dark:from-green-700 dark:to-green-800",
        "p-2",
      )}
    >
      <div className="absolute top-1/2 left-1/2 h-[30%] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/40" />
      <div className="absolute top-1/2 left-0 h-0.5 w-full bg-white/40" />
      <div className="absolute top-0 left-[20%] h-[16%] w-[60%] rounded-b-sm border-2 border-t-0 border-white/40" />
      <div className="absolute top-0 left-[35%] h-[8%] w-[30%] rounded-b-sm border-2 border-t-0 border-white/40" />
      <div className="absolute bottom-0 left-[20%] h-[16%] w-[60%] rounded-t-sm border-2 border-b-0 border-white/40" />
      <div className="absolute bottom-0 left-[35%] h-[8%] w-[30%] rounded-t-sm border-2 border-b-0 border-white/40" />

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center text-white">
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-2 text-xs leading-relaxed text-white/85">
          {description}
        </p>
      </div>
    </div>
  );
}

function getPlayerEventMarkers(events: GameTimelineEvent[]) {
  const markers = new Map<string, string[]>();

  const pushMarker = (playerId: string, marker: string) => {
    const current = markers.get(playerId) ?? [];
    current.push(marker);
    markers.set(playerId, current);
  };

  for (const event of events) {
    switch (event.type) {
      case "goal":
        pushMarker(event.playerId, "⚽");
        break;
      case "yellow_card":
        pushMarker(event.playerId, "🟨");
        break;
      case "red_card":
        pushMarker(event.playerId, "🟥");
        break;
      case "penalty_scored":
        pushMarker(event.playerId, "🎯");
        break;
      case "penalty_missed":
        pushMarker(event.playerId, "❌");
        break;
      case "substitution":
        break;
      default:
        break;
    }
  }

  return markers;
}

function getPlayerSubstitutionLinks(
  events: GameTimelineEvent[],
  starterIds: Set<string>,
) {
  const substitutions = new Map<string, PlayerSubstitutionLink[]>();
  const incomingSubstitutions = new Map<string, PlayerSubstitutionLink[]>();
  const incomingPlayerIds = new Set<string>();

  for (const event of events) {
    if (event.type !== "substitution" || !event.relatedPlayerId) {
      continue;
    }

    const playerIsStarter = starterIds.has(String(event.playerId));
    const relatedPlayerIsStarter = starterIds.has(
      String(event.relatedPlayerId),
    );

    let outgoingPlayerId = String(event.playerId);
    let incomingPlayerId = String(event.relatedPlayerId);

    if (!playerIsStarter && relatedPlayerIsStarter) {
      outgoingPlayerId = String(event.relatedPlayerId);
      incomingPlayerId = String(event.playerId);
    }

    const current = substitutions.get(outgoingPlayerId) ?? [];
    current.push({
      outgoingPlayerId,
      incomingPlayerId,
    });
    substitutions.set(outgoingPlayerId, current);
    const currentIncoming = incomingSubstitutions.get(incomingPlayerId) ?? [];
    currentIncoming.push({
      outgoingPlayerId,
      incomingPlayerId,
    });
    incomingSubstitutions.set(incomingPlayerId, currentIncoming);
    incomingPlayerIds.add(incomingPlayerId);
  }

  return {
    substitutionsByOutgoingPlayer: substitutions,
    substitutionsByIncomingPlayer: incomingSubstitutions,
    incomingPlayerIds,
  };
}

function LineupPlayersList({
  lineup,
  fallbackPlayers,
  orgSlug,
  routeScope,
  currentClubSlug,
  teamClubSlug,
  eventMarkers,
  substitutionsByOutgoingPlayer,
  incomingPlayerIds,
  noLabel,
  nameLabel,
  startersLabel,
  substitutesLabel,
  emptyLabel,
}: {
  lineup: FootballLineup;
  fallbackPlayers: FootballLineupPlayer[];
  orgSlug: string;
  routeScope: "org" | "team";
  currentClubSlug?: string;
  teamClubSlug: string;
  eventMarkers: Map<string, string[]>;
  substitutionsByOutgoingPlayer: Map<string, PlayerSubstitutionLink[]>;
  incomingPlayerIds: Set<string>;
  noLabel: string;
  nameLabel: string;
  startersLabel: string;
  substitutesLabel: string;
  emptyLabel: string;
}) {
  const router = useRouter();
  const playersById = useMemo(() => {
    const allPlayers = [
      ...lineup.starters,
      ...(lineup.substitutes ?? []),
      ...fallbackPlayers,
    ];
    return new Map(allPlayers.map((player) => [String(player.id), player]));
  }, [fallbackPlayers, lineup.starters, lineup.substitutes]);

  const visibleStarters = useMemo(() => {
    const starterMap = new Map<string, FootballLineupPlayer>();

    for (const player of lineup.starters) {
      if (!incomingPlayerIds.has(String(player.id))) {
        starterMap.set(String(player.id), player);
      }
    }

    for (const [outgoingPlayerId] of substitutionsByOutgoingPlayer) {
      if (!starterMap.has(outgoingPlayerId)) {
        const fallbackPlayer = playersById.get(outgoingPlayerId);
        if (fallbackPlayer) {
          starterMap.set(outgoingPlayerId, fallbackPlayer);
        }
      }
    }

    return Array.from(starterMap.values());
  }, [
    incomingPlayerIds,
    lineup.starters,
    playersById,
    substitutionsByOutgoingPlayer,
  ]);

  const substitutes = useMemo(() => {
    return (lineup.substitutes ?? []).filter(
      (player) =>
        !incomingPlayerIds.has(String(player.id)) &&
        !visibleStarters.some(
          (visibleStarter) => String(visibleStarter.id) === String(player.id),
        ),
    );
  }, [incomingPlayerIds, lineup.substitutes, visibleStarters]);

  const hasPlayers = visibleStarters.length > 0 || substitutes.length > 0;

  const getPlayerHref = (player: FootballLineupPlayer) => {
    if (routeScope === "org") {
      return ROUTES.org.teams.playerDetail(
        orgSlug,
        teamClubSlug,
        String(player.id),
      );
    }

    if (currentClubSlug === teamClubSlug) {
      return TEAM_ROUTES.rosterPlayerDetail(
        orgSlug,
        teamClubSlug,
        String(player.id),
      );
    }

    return null;
  };

  if (!hasPlayers) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <div className="grid grid-cols-[28px_minmax(0,1fr)] items-center gap-2 border-b px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <span>{noLabel}</span>
        <span>{nameLabel}</span>
      </div>

      {visibleStarters.map((player) => (
        <div key={player.id} className="border-b last:border-b-0">
          <button
            type="button"
            className="grid w-full grid-cols-[28px_minmax(0,1fr)] items-center gap-2 px-3 py-2 text-xs"
            onClick={() => {
              const href = getPlayerHref(player);
              if (href) {
                router.push(href);
              }
            }}
            disabled={!getPlayerHref(player)}
          >
            <span className="font-medium tabular-nums text-muted-foreground">
              {player.number}
            </span>
            <span
              className={cn(
                "flex min-w-0 items-center gap-2 truncate text-left font-medium",
                getPlayerHref(player) && "cursor-pointer hover:underline",
              )}
            >
              <span className="truncate">{player.name}</span>
              {eventMarkers.get(String(player.id))?.length ? (
                <span className="inline-flex shrink-0 items-center gap-1 text-sm leading-none">
                  {eventMarkers.get(String(player.id))!.map((marker, index) => (
                    <span key={`${player.id}-${marker}-${index}`}>
                      {marker}
                    </span>
                  ))}
                </span>
              ) : null}
            </span>
          </button>

          {substitutionsByOutgoingPlayer
            .get(String(player.id))
            ?.map((substitution, index) => {
              const incomingPlayer = playersById.get(
                substitution.incomingPlayerId,
              );
              if (!incomingPlayer) {
                return null;
              }

              return (
                <button
                  type="button"
                  key={`${player.id}-sub-${substitution.incomingPlayerId}-${index}`}
                  className="grid w-full grid-cols-[28px_minmax(0,1fr)] items-center gap-2 border-t border-border/60 bg-muted/20 px-3 py-1.5 text-xs"
                  onClick={() => {
                    const href = getPlayerHref(incomingPlayer);
                    if (href) {
                      router.push(href);
                    }
                  }}
                  disabled={!getPlayerHref(incomingPlayer)}
                >
                  <span />
                  <span
                    className={cn(
                      "flex min-w-0 items-center gap-1.5 truncate pl-1 text-left font-medium",
                      getPlayerHref(incomingPlayer) &&
                        "cursor-pointer hover:underline",
                    )}
                  >
                    <span className="shrink-0 text-[11px] leading-none text-muted-foreground">
                      ↕
                    </span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {incomingPlayer.number}
                    </span>
                    <span className="truncate">{incomingPlayer.name}</span>
                    {eventMarkers.get(String(incomingPlayer.id))?.length ? (
                      <span className="inline-flex shrink-0 items-center gap-1 text-sm leading-none">
                        {eventMarkers
                          .get(String(incomingPlayer.id))!
                          .map((marker, markerIndex) => (
                            <span
                              key={`${incomingPlayer.id}-${marker}-${markerIndex}`}
                            >
                              {marker}
                            </span>
                          ))}
                      </span>
                    ) : null}
                  </span>
                </button>
              );
            })}
        </div>
      ))}

      {substitutes.length > 0 ? (
        <>
          <div className="border-y bg-muted/30 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {substitutesLabel}
          </div>
          {substitutes.map((player) => (
            <button
              type="button"
              key={player.id}
              className="grid grid-cols-[28px_minmax(0,1fr)] items-center gap-2 border-b px-3 py-2 text-xs last:border-b-0"
              onClick={() => {
                const href = getPlayerHref(player);
                if (href) {
                  router.push(href);
                }
              }}
              disabled={!getPlayerHref(player)}
            >
              <span className="font-medium tabular-nums text-muted-foreground">
                {player.number}
              </span>
              <span
                className={cn(
                  "flex min-w-0 items-center gap-2 truncate text-left font-medium",
                  getPlayerHref(player) && "cursor-pointer hover:underline",
                )}
              >
                <span className="truncate">{player.name}</span>
                {eventMarkers.get(String(player.id))?.length ? (
                  <span className="inline-flex shrink-0 items-center gap-1 text-sm leading-none">
                    {eventMarkers
                      .get(String(player.id))!
                      .map((marker, index) => (
                        <span key={`${player.id}-${marker}-${index}`}>
                          {marker}
                        </span>
                      ))}
                  </span>
                ) : null}
              </span>
            </button>
          ))}
        </>
      ) : null}
    </div>
  );
}

function LineupTabPanel({
  lineup,
  fallbackPlayers,
  orgSlug,
  routeScope,
  currentClubSlug,
  teamClubSlug,
  eventMarkers,
  substitutionsByOutgoingPlayer,
  incomingPlayerIds,
  pendingFormationDescription,
  noLabel,
  nameLabel,
  startersLabel,
  substitutesLabel,
  emptyLabel,
}: {
  lineup: FootballLineup;
  fallbackPlayers: FootballLineupPlayer[];
  orgSlug: string;
  routeScope: "org" | "team";
  currentClubSlug?: string;
  teamClubSlug: string;
  eventMarkers: Map<string, string[]>;
  substitutionsByOutgoingPlayer: Map<string, PlayerSubstitutionLink[]>;
  incomingPlayerIds: Set<string>;
  pendingFormationDescription: string;
  noLabel: string;
  nameLabel: string;
  startersLabel: string;
  substitutesLabel: string;
  emptyLabel: string;
}) {
  return (
    <div className="space-y-4">
      {lineup.formation ? (
        <FootballField
          lineup={lineup}
          className="mx-auto max-w-[272px] sm:max-w-[320px]"
        />
      ) : (
        <FieldPlaceholder
          title={lineup.teamName}
          description={pendingFormationDescription}
        />
      )}

      <LineupPlayersList
        lineup={lineup}
        fallbackPlayers={fallbackPlayers}
        orgSlug={orgSlug}
        routeScope={routeScope}
        currentClubSlug={currentClubSlug}
        teamClubSlug={teamClubSlug}
        eventMarkers={eventMarkers}
        substitutionsByOutgoingPlayer={substitutionsByOutgoingPlayer}
        incomingPlayerIds={incomingPlayerIds}
        noLabel={noLabel}
        nameLabel={nameLabel}
        startersLabel={startersLabel}
        substitutesLabel={substitutesLabel}
        emptyLabel={emptyLabel}
      />
    </div>
  );
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
    () => (gameStats?.homeStats ?? []).map(mapStatToLineupPlayer),
    [gameStats?.homeStats],
  );
  const awayFallbackPlayers = useMemo(
    () => (gameStats?.awayStats ?? []).map(mapStatToLineupPlayer),
    [gameStats?.awayStats],
  );
  const canEditLineups =
    Boolean(gameLineups?.canEditHome) || Boolean(gameLineups?.canEditAway);
  const areLineupsLocked =
    Boolean(matchStartedAt) ||
    Boolean(matchEndedAt) ||
    gameStatus !== "scheduled";
  const playerEventMarkers = useMemo(
    () => getPlayerEventMarkers(timelineData?.events ?? []),
    [timelineData?.events],
  );
  const homeTimelineEvents = useMemo(
    () => (timelineData?.events ?? []).filter((event) => event.side === "home"),
    [timelineData?.events],
  );
  const awayTimelineEvents = useMemo(
    () => (timelineData?.events ?? []).filter((event) => event.side === "away"),
    [timelineData?.events],
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
  const homeLineupWithSubstitutions = useMemo(() => {
    const playersById = new Map(
      [
        ...homeLineup.starters,
        ...(homeLineup.substitutes ?? []),
        ...homeFallbackPlayers,
      ].map((player) => [String(player.id), player]),
    );

    return {
      ...homeLineup,
      starters: homeLineup.starters.map((player) =>
        clonePlayerWithSubstitutionLines(
          player,
          homeSubstitutionData.substitutionsByOutgoingPlayer,
          homeSubstitutionData.substitutionsByIncomingPlayer,
          playersById,
          t("games.lineups.substitutedBy"),
          t("games.lineups.enteredFor"),
        ),
      ),
      substitutes: (homeLineup.substitutes ?? []).map((player) =>
        clonePlayerWithSubstitutionLines(
          player,
          homeSubstitutionData.substitutionsByOutgoingPlayer,
          homeSubstitutionData.substitutionsByIncomingPlayer,
          playersById,
          t("games.lineups.substitutedBy"),
          t("games.lineups.enteredFor"),
        ),
      ),
      slots: homeLineup.slots?.map((slot) => ({
        ...slot,
        ...(slot.player
          ? {
              player: clonePlayerWithSubstitutionLines(
                slot.player,
                homeSubstitutionData.substitutionsByOutgoingPlayer,
                homeSubstitutionData.substitutionsByIncomingPlayer,
                playersById,
                t("games.lineups.substitutedBy"),
                t("games.lineups.enteredFor"),
              ),
            }
          : {}),
      })),
    };
  }, [homeFallbackPlayers, homeLineup, homeSubstitutionData, t]);
  const awayLineupWithSubstitutions = useMemo(() => {
    const playersById = new Map(
      [
        ...awayLineup.starters,
        ...(awayLineup.substitutes ?? []),
        ...awayFallbackPlayers,
      ].map((player) => [String(player.id), player]),
    );

    return {
      ...awayLineup,
      starters: awayLineup.starters.map((player) =>
        clonePlayerWithSubstitutionLines(
          player,
          awaySubstitutionData.substitutionsByOutgoingPlayer,
          awaySubstitutionData.substitutionsByIncomingPlayer,
          playersById,
          t("games.lineups.substitutedBy"),
          t("games.lineups.enteredFor"),
        ),
      ),
      substitutes: (awayLineup.substitutes ?? []).map((player) =>
        clonePlayerWithSubstitutionLines(
          player,
          awaySubstitutionData.substitutionsByOutgoingPlayer,
          awaySubstitutionData.substitutionsByIncomingPlayer,
          playersById,
          t("games.lineups.substitutedBy"),
          t("games.lineups.enteredFor"),
        ),
      ),
      slots: awayLineup.slots?.map((slot) => ({
        ...slot,
        ...(slot.player
          ? {
              player: clonePlayerWithSubstitutionLines(
                slot.player,
                awaySubstitutionData.substitutionsByOutgoingPlayer,
                awaySubstitutionData.substitutionsByIncomingPlayer,
                playersById,
                t("games.lineups.substitutedBy"),
                t("games.lineups.enteredFor"),
              ),
            }
          : {}),
      })),
    };
  }, [awayFallbackPlayers, awayLineup, awaySubstitutionData, t]);

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
                <TeamBadge
                  team={homeTeam}
                  label={homeLineup.formation?.trim() || "—"}
                />
              </TabsTrigger>
              <TabsTrigger
                value="away"
                className="mr-0 min-w-0 rounded-full px-2 pt-1.5 pb-2 text-xs sm:px-3 sm:text-sm"
              >
                <TeamBadge
                  team={awayTeam}
                  label={awayLineup.formation?.trim() || "—"}
                />
              </TabsTrigger>
            </TabsList>

            <TabsContent value="home" className="mt-4 w-full min-w-0">
              <LineupTabPanel
                lineup={homeLineupWithSubstitutions}
                fallbackPlayers={homeFallbackPlayers}
                orgSlug={orgSlug}
                routeScope={routeScope}
                currentClubSlug={currentClubSlug}
                teamClubSlug={homeTeam.clubSlug}
                eventMarkers={playerEventMarkers}
                substitutionsByOutgoingPlayer={
                  homeSubstitutionData.substitutionsByOutgoingPlayer
                }
                incomingPlayerIds={homeSubstitutionData.incomingPlayerIds}
                pendingFormationDescription={t(
                  "games.lineups.pendingFormationDescription",
                )}
                noLabel={t("games.lineups.number")}
                nameLabel={t("games.lineups.name")}
                startersLabel={t("games.lineups.starters")}
                substitutesLabel={t("games.lineups.substitutes")}
                emptyLabel={t("games.lineups.empty")}
              />
            </TabsContent>

            <TabsContent value="away" className="mt-4 w-full min-w-0">
              <LineupTabPanel
                lineup={awayLineupWithSubstitutions}
                fallbackPlayers={awayFallbackPlayers}
                orgSlug={orgSlug}
                routeScope={routeScope}
                currentClubSlug={currentClubSlug}
                teamClubSlug={awayTeam.clubSlug}
                eventMarkers={playerEventMarkers}
                substitutionsByOutgoingPlayer={
                  awaySubstitutionData.substitutionsByOutgoingPlayer
                }
                incomingPlayerIds={awaySubstitutionData.incomingPlayerIds}
                pendingFormationDescription={t(
                  "games.lineups.pendingFormationDescription",
                )}
                noLabel={t("games.lineups.number")}
                nameLabel={t("games.lineups.name")}
                startersLabel={t("games.lineups.starters")}
                substitutesLabel={t("games.lineups.substitutes")}
                emptyLabel={t("games.lineups.empty")}
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
