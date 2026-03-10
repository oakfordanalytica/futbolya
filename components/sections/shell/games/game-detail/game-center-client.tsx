"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Preloaded,
  useMutation,
  usePreloadedQuery,
  useQuery,
} from "convex/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FootballField } from "@/components/ui/football-field";
import type {
  FootballLineup,
  FootballLineupPlayer,
  FootballLineupSlot,
} from "@/components/ui/football-field.types";
import { PlayerPicker, type PlayerPickerOption } from "./player-picker";
import {
  GAME_EVENT_TYPES,
  GAME_EVENT_TYPE_ICONS,
  type GameEventType,
} from "@/lib/games/event-types";
import { ROUTES } from "@/lib/navigation/routes";
import { useRouter } from "@/i18n/navigation";
import { parseLocalDateTime } from "@/lib/utils/date";
import { cn } from "@/lib/utils";

interface GameCenterClientProps {
  preloadedGame: Preloaded<typeof api.games.getById>;
  orgSlug: string;
}

type CenterTeamKey = "home" | "away";

type TimelineEvent = {
  id: string;
  side: CenterTeamKey;
  type: GameEventType;
  minute: number | string;
  playerId: string;
  relatedPlayerId?: string;
  primaryText?: string;
  secondaryText?: string;
};

type CenterRosterPlayer = PlayerPickerOption & {
  lastName?: string;
  photoUrl?: string;
  position?: string;
};

type CenterLineupPlayer = {
  playerId: string;
  playerName: string;
  lastName: string;
  jerseyNumber?: number;
  cometNumber?: string;
  photoUrl?: string;
  position?: string;
};

type CenterLineupSlot = {
  id: string;
  x: number;
  y: number;
  role: "goalkeeper" | "outfield";
  player?: CenterLineupPlayer;
};

type CenterResolvedTeam = {
  key: CenterTeamKey;
  clubId: string;
  teamName: string;
  teamLogoUrl?: string;
  teamColor?: string;
  formation?: string;
  lineup: FootballLineup | null;
  roster: CenterRosterPlayer[];
  onFieldPlayerIds: Set<string>;
};

function formatClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function buildDisplayLastName(playerName: string, lastName?: string) {
  if (lastName?.trim()) {
    return lastName.trim();
  }

  const parts = playerName.trim().split(/\s+/);
  return parts.length > 1 ? parts[1] : (parts[0] ?? "");
}

function buildPlayerInitials(playerName: string) {
  const parts = playerName.trim().split(/\s+/).filter(Boolean).slice(0, 2);

  return parts.map((part) => part.charAt(0).toUpperCase()).join("");
}

function mapLineupPlayer(player: CenterLineupPlayer): FootballLineupPlayer {
  return {
    id: player.playerId,
    name: player.playerName,
    lastName: player.lastName,
    photoUrl: player.photoUrl,
    number: player.jerseyNumber !== undefined ? `${player.jerseyNumber}` : "—",
    position: player.position,
  };
}

function mapRosterPlayer(player: CenterRosterPlayer): FootballLineupPlayer {
  return {
    id: player._id,
    name: player.playerName,
    lastName: buildDisplayLastName(player.playerName, player.lastName),
    photoUrl: player.photoUrl,
    number: player.jerseyNumber !== undefined ? `${player.jerseyNumber}` : "—",
    position: player.position,
  };
}

function sortTimelineEvents(events: TimelineEvent[]) {
  return [...events].sort((left, right) => {
    const leftMinute =
      typeof left.minute === "number" ? left.minute : Number(left.minute);
    const rightMinute =
      typeof right.minute === "number" ? right.minute : Number(right.minute);

    if (leftMinute !== rightMinute) {
      return leftMinute - rightMinute;
    }

    return left.id.localeCompare(right.id);
  });
}

function resolveLiveLineup(args: {
  teamKey: CenterTeamKey;
  teamName: string;
  teamColor?: string;
  teamLineup:
    | {
        formation?: string;
        slots: CenterLineupSlot[];
      }
    | null
    | undefined;
  roster: CenterRosterPlayer[];
  events: TimelineEvent[];
}) {
  if (!args.teamLineup || args.teamLineup.slots.length === 0) {
    return {
      lineup: null,
      onFieldPlayerIds: new Set<string>(),
    };
  }

  const rosterById = new Map(
    args.roster.map((player) => [String(player._id), player]),
  );

  const currentSlots: FootballLineupSlot[] = args.teamLineup.slots.map(
    (slot) => ({
      id: slot.id,
      x: slot.x,
      y: slot.y,
      role: slot.role,
      ...(slot.player ? { player: mapLineupPlayer(slot.player) } : {}),
    }),
  );

  const currentOnFieldIds = new Set<string>(
    currentSlots
      .map((slot) => (slot.player ? String(slot.player.id) : null))
      .filter((playerId): playerId is string => Boolean(playerId)),
  );

  const substitutionEvents = sortTimelineEvents(
    args.events.filter(
      (event) =>
        event.side === args.teamKey &&
        event.type === "substitution" &&
        event.relatedPlayerId,
    ),
  );

  for (const event of substitutionEvents) {
    if (!event.relatedPlayerId) {
      continue;
    }

    let outgoingPlayerId = String(event.playerId);
    let incomingPlayerId = String(event.relatedPlayerId);

    // Support current semantics and older inverted substitution events.
    if (
      !currentOnFieldIds.has(outgoingPlayerId) &&
      currentOnFieldIds.has(incomingPlayerId)
    ) {
      outgoingPlayerId = String(event.relatedPlayerId);
      incomingPlayerId = String(event.playerId);
    }

    const targetSlot = currentSlots.find(
      (slot) => String(slot.player?.id) === outgoingPlayerId,
    );
    if (!targetSlot) {
      continue;
    }

    const incomingPlayer = rosterById.get(incomingPlayerId);
    currentOnFieldIds.delete(outgoingPlayerId);
    currentOnFieldIds.add(incomingPlayerId);
    targetSlot.player = incomingPlayer
      ? mapRosterPlayer(incomingPlayer)
      : {
          id: incomingPlayerId,
          name: event.secondaryText ?? "Jugador",
          lastName: buildDisplayLastName(event.secondaryText ?? "Jugador"),
          number: "—",
        };
  }

  return {
    lineup: {
      teamName: args.teamName,
      teamColor: args.teamColor,
      formation: args.teamLineup.formation,
      slots: currentSlots,
      starters: currentSlots
        .map((slot) => slot.player)
        .filter((player): player is FootballLineupPlayer => Boolean(player)),
      substitutes: args.roster
        .filter((player) => !currentOnFieldIds.has(String(player._id)))
        .map(mapRosterPlayer),
    } satisfies FootballLineup,
    onFieldPlayerIds: currentOnFieldIds,
  };
}

function TeamBadge({
  teamName,
  logoUrl,
  label,
}: {
  teamName: string;
  logoUrl?: string;
  label?: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={teamName}
          width={18}
          height={18}
          className="size-[18px] object-contain"
        />
      ) : (
        <div className="flex size-[18px] items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
          {teamName.charAt(0).toUpperCase()}
        </div>
      )}
      <span className="truncate font-semibold">{label?.trim() || "—"}</span>
    </div>
  );
}

export function GameCenterClient({
  preloadedGame,
  orgSlug,
}: GameCenterClientProps) {
  const t = useTranslations("Common");
  const router = useRouter();
  const game = usePreloadedQuery(preloadedGame);
  const lineupData = useQuery(
    api.gameLineups.getEditorData,
    game ? { gameId: game._id as Id<"games"> } : "skip",
  );
  const timelineData = useQuery(
    api.gameEvents.getByGameId,
    game ? { gameId: game._id as Id<"games"> } : "skip",
  );
  const startMatch = useMutation(api.gameCenter.startMatch);
  const finishMatch = useMutation(api.gameCenter.finishMatch);
  const registerBatch = useMutation(api.gameEvents.registerBatch);

  const [activeTeam, setActiveTeam] = useState<CenterTeamKey>("home");
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [selectedEventType, setSelectedEventType] =
    useState<GameEventType | null>(null);
  const [incomingPlayerId, setIncomingPlayerId] = useState("");
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (game?.matchEndedAt) {
      return;
    }

    setNowMs(Date.now());
    const intervalId = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, [game?.matchEndedAt]);

  useEffect(() => {
    setSelectedSlotId(null);
    setSelectedEventType(null);
    setIncomingPlayerId("");
  }, [activeTeam]);

  useEffect(() => {
    setSelectedEventType(null);
    setIncomingPlayerId("");
  }, [selectedSlotId]);

  const events = useMemo(
    () =>
      timelineData?.events.map((event) => ({
        ...event,
        playerId: String(event.playerId),
        relatedPlayerId: event.relatedPlayerId
          ? String(event.relatedPlayerId)
          : undefined,
      })) ?? [],
    [timelineData?.events],
  );

  const homeResolved = useMemo(() => {
    if (!lineupData) {
      return null;
    }

    const resolved = resolveLiveLineup({
      teamKey: "home",
      teamName: lineupData.homeTeam.teamName,
      teamColor: lineupData.homeTeam.teamColor,
      teamLineup: lineupData.homeTeam.lineup
        ? {
            formation: lineupData.homeTeam.lineup.formation,
            slots: lineupData.homeTeam.lineup.slots.map((slot) => ({
              id: slot.id,
              x: slot.x,
              y: slot.y,
              role: slot.role,
              player: slot.player
                ? {
                    playerId: String(slot.player.playerId),
                    playerName: slot.player.playerName,
                    lastName: slot.player.lastName,
                    jerseyNumber: slot.player.jerseyNumber,
                    cometNumber: slot.player.cometNumber,
                    photoUrl: slot.player.photoUrl,
                    position: slot.player.position,
                  }
                : undefined,
            })),
          }
        : null,
      roster: lineupData.homeTeam.roster.map((player) => ({
        _id: String(player._id),
        clubId: String(lineupData.homeTeam.clubId),
        teamName: lineupData.homeTeam.teamName,
        playerName: player.playerName,
        lastName: player.lastName,
        jerseyNumber: player.jerseyNumber,
        cometNumber: player.cometNumber,
        photoUrl: player.photoUrl,
        position: player.position,
      })),
      events,
    });

    return {
      key: "home" as const,
      clubId: String(lineupData.homeTeam.clubId),
      teamName: lineupData.homeTeam.teamName,
      teamLogoUrl: lineupData.homeTeam.teamLogoUrl,
      teamColor: lineupData.homeTeam.teamColor,
      formation: lineupData.homeTeam.lineup?.formation,
      lineup: resolved.lineup,
      roster: lineupData.homeTeam.roster.map((player) => ({
        _id: String(player._id),
        clubId: String(lineupData.homeTeam.clubId),
        teamName: lineupData.homeTeam.teamName,
        playerName: player.playerName,
        lastName: player.lastName,
        jerseyNumber: player.jerseyNumber,
        cometNumber: player.cometNumber,
        photoUrl: player.photoUrl,
        position: player.position,
      })),
      onFieldPlayerIds: resolved.onFieldPlayerIds,
    } satisfies CenterResolvedTeam;
  }, [events, lineupData]);

  const awayResolved = useMemo(() => {
    if (!lineupData) {
      return null;
    }

    const resolved = resolveLiveLineup({
      teamKey: "away",
      teamName: lineupData.awayTeam.teamName,
      teamColor: lineupData.awayTeam.teamColor,
      teamLineup: lineupData.awayTeam.lineup
        ? {
            formation: lineupData.awayTeam.lineup.formation,
            slots: lineupData.awayTeam.lineup.slots.map((slot) => ({
              id: slot.id,
              x: slot.x,
              y: slot.y,
              role: slot.role,
              player: slot.player
                ? {
                    playerId: String(slot.player.playerId),
                    playerName: slot.player.playerName,
                    lastName: slot.player.lastName,
                    jerseyNumber: slot.player.jerseyNumber,
                    cometNumber: slot.player.cometNumber,
                    photoUrl: slot.player.photoUrl,
                    position: slot.player.position,
                  }
                : undefined,
            })),
          }
        : null,
      roster: lineupData.awayTeam.roster.map((player) => ({
        _id: String(player._id),
        clubId: String(lineupData.awayTeam.clubId),
        teamName: lineupData.awayTeam.teamName,
        playerName: player.playerName,
        lastName: player.lastName,
        jerseyNumber: player.jerseyNumber,
        cometNumber: player.cometNumber,
        photoUrl: player.photoUrl,
        position: player.position,
      })),
      events,
    });

    return {
      key: "away" as const,
      clubId: String(lineupData.awayTeam.clubId),
      teamName: lineupData.awayTeam.teamName,
      teamLogoUrl: lineupData.awayTeam.teamLogoUrl,
      teamColor: lineupData.awayTeam.teamColor,
      formation: lineupData.awayTeam.lineup?.formation,
      lineup: resolved.lineup,
      roster: lineupData.awayTeam.roster.map((player) => ({
        _id: String(player._id),
        clubId: String(lineupData.awayTeam.clubId),
        teamName: lineupData.awayTeam.teamName,
        playerName: player.playerName,
        lastName: player.lastName,
        jerseyNumber: player.jerseyNumber,
        cometNumber: player.cometNumber,
        photoUrl: player.photoUrl,
        position: player.position,
      })),
      onFieldPlayerIds: resolved.onFieldPlayerIds,
    } satisfies CenterResolvedTeam;
  }, [events, lineupData]);

  const activeResolvedTeam =
    activeTeam === "home" ? homeResolved : awayResolved;
  const selectedSlot =
    activeResolvedTeam?.lineup?.slots?.find(
      (slot) => slot.id === selectedSlotId,
    ) ?? null;

  useEffect(() => {
    if (
      selectedSlotId &&
      activeResolvedTeam?.lineup?.slots?.every(
        (slot) => slot.id !== selectedSlotId,
      )
    ) {
      setSelectedSlotId(null);
      setSelectedEventType(null);
      setIncomingPlayerId("");
    }
  }, [activeResolvedTeam?.lineup?.slots, selectedSlotId]);

  const offFieldPlayers = useMemo(() => {
    if (!activeResolvedTeam) {
      return [];
    }

    return activeResolvedTeam.roster.filter(
      (player) => !activeResolvedTeam.onFieldPlayerIds.has(String(player._id)),
    );
  }, [activeResolvedTeam]);

  const scheduledDateTime = useMemo(() => {
    if (!game) {
      return null;
    }

    return parseLocalDateTime(game.date, game.startTime);
  }, [game]);

  const hasStarted = Boolean(game?.matchStartedAt);
  const hasEnded = Boolean(game?.matchEndedAt);
  const canStart =
    Boolean(game) &&
    !hasStarted &&
    !hasEnded &&
    Boolean(scheduledDateTime) &&
    nowMs >= (scheduledDateTime?.getTime() ?? Number.POSITIVE_INFINITY);
  const isLive = hasStarted && !hasEnded;

  const elapsedSeconds = game?.matchStartedAt
    ? Math.max(
        0,
        Math.floor(((game.matchEndedAt ?? nowMs) - game.matchStartedAt) / 1000),
      )
    : 0;
  const liveMinute = Math.max(
    1,
    Math.min(130, Math.floor(elapsedSeconds / 60) + 1),
  );

  if (game === null) {
    return (
      <div className="p-4 md:p-6">
        <Heading>{t("errors.notFound")}</Heading>
      </div>
    );
  }

  const handleRegisterEvent = async () => {
    if (!selectedSlot?.player || !selectedEventType) {
      return;
    }

    setIsSubmitting(true);
    try {
      await registerBatch({
        gameId: game._id as Id<"games">,
        minute: liveMinute,
        events: [
          {
            playerId: String(selectedSlot.player.id) as Id<"players">,
            relatedPlayerId:
              selectedEventType === "substitution" && incomingPlayerId
                ? (incomingPlayerId as Id<"players">)
                : undefined,
            eventType: selectedEventType,
          },
        ],
      });
      toast.success(t("games.events.saved"));
      setSelectedSlotId(null);
      setSelectedEventType(null);
      setIncomingPlayerId("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("errors.generic");
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSlotEventPopoverContent = (slot: FootballLineupSlot) => {
    if (!slot.player) {
      return (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {t("games.center.noPlayerAssigned")}
          </p>
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => {
                setSelectedSlotId(null);
                setSelectedEventType(null);
                setIncomingPlayerId("");
              }}
            >
              {t("actions.close")}
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="rounded-lg border bg-muted/20 px-3 py-3">
          <div className="flex items-center gap-3">
            <Avatar
              src={slot.player.photoUrl}
              initials={
                slot.player.photoUrl
                  ? undefined
                  : buildPlayerInitials(slot.player.name)
              }
              alt={slot.player.name}
              className={cn(
                "size-9 text-[11px] text-muted-foreground",
                !slot.player.photoUrl && "bg-muted",
              )}
            />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">
                {slot.player.name}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {t("games.center.currentMinute", {
                  minute: liveMinute,
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {GAME_EVENT_TYPES.map((eventType) => {
            const isSelected = selectedEventType === eventType;
            const isSubstitution = eventType === "substitution";
            const substitutionDisabled =
              isSubstitution && offFieldPlayers.length === 0;

            return (
              <Button
                key={eventType}
                type="button"
                variant={isSelected ? "default" : "outline"}
                className={cn(
                  "h-auto min-h-11 flex-col gap-1 px-2 py-2 text-[11px]",
                  isSelected && "ring-2 ring-offset-2",
                )}
                disabled={substitutionDisabled || isSubmitting}
                onClick={() => {
                  setSelectedEventType(eventType);
                  if (eventType !== "substitution") {
                    setIncomingPlayerId("");
                  }
                }}
              >
                <span className="text-base leading-none">
                  {GAME_EVENT_TYPE_ICONS[eventType]}
                </span>
                <span className="text-center leading-tight">
                  {t(`games.events.typeOptions.${eventType}`)}
                </span>
              </Button>
            );
          })}
        </div>

        {selectedEventType === "substitution" ? (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              {t("games.events.incomingPlayer")}
            </p>
            <PlayerPicker
              players={offFieldPlayers}
              value={incomingPlayerId}
              onChange={setIncomingPlayerId}
              placeholder={t("games.events.incomingPlayerPlaceholder")}
              searchPlaceholder={t("games.events.incomingPlayerSearch")}
              emptyMessage={t("games.events.incomingPlayerEmpty")}
              disabled={isSubmitting}
            />
          </div>
        ) : null}

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => {
              setSelectedSlotId(null);
              setSelectedEventType(null);
              setIncomingPlayerId("");
            }}
            disabled={isSubmitting}
          >
            {t("actions.cancel")}
          </Button>
          <Button
            type="button"
            className="flex-1"
            disabled={
              !selectedEventType ||
              isSubmitting ||
              (selectedEventType === "substitution" && !incomingPlayerId)
            }
            onClick={handleRegisterEvent}
          >
            {isSubmitting
              ? t("actions.loading")
              : t("games.center.registerSelectedEvent")}
          </Button>
        </div>
      </div>
    );
  };

  const handleStartMatch = async () => {
    setIsSubmitting(true);
    try {
      await startMatch({ gameId: game._id as Id<"games"> });
      toast.success(t("games.center.started"));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("errors.generic");
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishMatch = async () => {
    setIsSubmitting(true);
    try {
      await finishMatch({ gameId: game._id as Id<"games"> });
      toast.success(t("games.center.finished"));
      setSelectedSlotId(null);
      setSelectedEventType(null);
      setIncomingPlayerId("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("errors.generic");
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-4 md:py-6">
      <Card className="gap-0 overflow-hidden rounded-xl pt-2 pb-0">
        <CardHeader className="grid-rows-[auto] gap-0 border-b px-3 pt-0 pb-2 md:px-5 [.border-b]:pb-2">
          <CardTitle className="text-base tracking-tight">
            {t("games.center.title")}
          </CardTitle>
          <CardAction>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2.5 text-xs"
              onClick={() =>
                router.push(ROUTES.org.games.detail(orgSlug, game._id))
              }
            >
              {t("actions.back")}
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="px-3 py-3 pt-2 md:px-5 md:py-5 md:pt-3">
          <div
            className={cn(
              "space-y-4 transition-all duration-300 ease-out",
              hasStarted && "border-b pb-4",
            )}
          >
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div className="flex min-w-0 flex-col items-center gap-2 text-center">
                {game.homeTeamLogo ? (
                  <Image
                    src={game.homeTeamLogo}
                    alt={game.homeTeamName}
                    width={52}
                    height={52}
                    className="size-12 object-contain"
                  />
                ) : (
                  <div className="flex size-12 items-center justify-center rounded-full bg-muted text-lg font-bold">
                    {game.homeTeamName.charAt(0)}
                  </div>
                )}
                <span className="text-xs font-semibold leading-tight">
                  {game.homeTeamName}
                </span>
              </div>

              <div className="flex flex-col items-center gap-1">
                <div className="text-2xl font-black tabular-nums">
                  {game.homeScore ?? 0} - {game.awayScore ?? 0}
                </div>
                <div className="rounded-full border px-3 py-1 text-xs font-semibold tabular-nums">
                  {formatClock(elapsedSeconds)}
                </div>
                <div className="text-[11px] font-medium text-muted-foreground">
                  {hasEnded
                    ? t("games.center.endedState")
                    : isLive
                      ? t("games.center.liveState", { minute: liveMinute })
                      : t("games.center.waitingState")}
                </div>
              </div>

              <div className="flex min-w-0 flex-col items-center gap-2 text-center">
                {game.awayTeamLogo ? (
                  <Image
                    src={game.awayTeamLogo}
                    alt={game.awayTeamName}
                    width={52}
                    height={52}
                    className="size-12 object-contain"
                  />
                ) : (
                  <div className="flex size-12 items-center justify-center rounded-full bg-muted text-lg font-bold">
                    {game.awayTeamName.charAt(0)}
                  </div>
                )}
                <span className="text-xs font-semibold leading-tight">
                  {game.awayTeamName}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              {!hasStarted ? (
                <Button
                  type="button"
                  className="flex-1"
                  onClick={handleStartMatch}
                  disabled={!canStart || isSubmitting}
                >
                  {isSubmitting
                    ? t("actions.loading")
                    : t("games.center.start")}
                </Button>
              ) : !hasEnded ? (
                <Button
                  type="button"
                  className="flex-1"
                  onClick={handleFinishMatch}
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? t("actions.loading")
                    : t("games.center.finish")}
                </Button>
              ) : (
                <Button type="button" className="flex-1" disabled>
                  {t("games.center.finished")}
                </Button>
              )}
            </div>
          </div>

          <div
            className={cn(
              "grid transition-all duration-300 ease-out",
              hasStarted
                ? "mt-4 grid-rows-[1fr] opacity-100"
                : "mt-0 grid-rows-[0fr] opacity-0",
            )}
          >
            <div className="min-h-0 overflow-hidden">
              <div className="space-y-4">
                <section className="space-y-3">
                  {lineupData === undefined ? (
                    <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
                      {t("actions.loading")}
                    </div>
                  ) : (
                    <Tabs
                      value={activeTeam}
                      onValueChange={(value) =>
                        setActiveTeam(value as CenterTeamKey)
                      }
                      className="min-w-0 w-full"
                    >
                      <TabsList className="grid h-auto w-full grid-cols-2 rounded-full border bg-muted/30 px-1 pt-1 pb-0">
                        <TabsTrigger
                          value="home"
                          className="mr-0 min-w-0 rounded-full px-2 pt-1.5 pb-2 text-xs sm:px-3 sm:text-sm"
                        >
                          <TeamBadge
                            teamName={lineupData.homeTeam.teamName}
                            logoUrl={lineupData.homeTeam.teamLogoUrl}
                            label={homeResolved?.formation ?? "—"}
                          />
                        </TabsTrigger>
                        <TabsTrigger
                          value="away"
                          className="mr-0 min-w-0 rounded-full px-2 pt-1.5 pb-2 text-xs sm:px-3 sm:text-sm"
                        >
                          <TeamBadge
                            teamName={lineupData.awayTeam.teamName}
                            logoUrl={lineupData.awayTeam.teamLogoUrl}
                            label={awayResolved?.formation ?? "—"}
                          />
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="home" className="mt-4">
                        {homeResolved?.lineup ? (
                          <div className="relative mx-auto w-full max-w-[320px] overflow-visible">
                            <FootballField
                              lineup={homeResolved.lineup}
                              className="mx-auto max-w-[320px]"
                              selectedSlotId={
                                activeTeam === "home" ? selectedSlotId : null
                              }
                              onSlotPopoverOpenChange={
                                isLive
                                  ? (slotId, open) =>
                                      setSelectedSlotId(open ? slotId : null)
                                  : undefined
                              }
                              renderSlotPopoverContent={
                                isLive
                                  ? renderSlotEventPopoverContent
                                  : undefined
                              }
                            />
                          </div>
                        ) : (
                          <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                            {t("games.center.noLineup")}
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="away" className="mt-4">
                        {awayResolved?.lineup ? (
                          <div className="relative mx-auto w-full max-w-[320px] overflow-visible">
                            <FootballField
                              lineup={awayResolved.lineup}
                              className="mx-auto max-w-[320px]"
                              selectedSlotId={
                                activeTeam === "away" ? selectedSlotId : null
                              }
                              onSlotPopoverOpenChange={
                                isLive
                                  ? (slotId, open) =>
                                      setSelectedSlotId(open ? slotId : null)
                                  : undefined
                              }
                              renderSlotPopoverContent={
                                isLive
                                  ? renderSlotEventPopoverContent
                                  : undefined
                              }
                            />
                          </div>
                        ) : (
                          <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                            {t("games.center.noLineup")}
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  )}
                </section>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
