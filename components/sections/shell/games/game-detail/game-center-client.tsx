"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import type { FootballLineupSlot } from "@/components/ui/football-field.types";
import { type GameEventType } from "@/lib/games/event-types";
import { ROUTES } from "@/lib/navigation/routes";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import {
  buildResolvedTeam,
  getGameCenterTiming,
  normalizeTimelineEvents,
  type CenterTeamKey,
} from "./game-center/domain";
import { GameCenterLiveFieldPanel } from "./game-center/live-field-panel";
import { GameCenterSlotEventPopoverContent } from "./game-center/slot-event-popover-content";
import { GameCenterSummaryPanel } from "./game-center/summary-panel";
import { StoppageTimeDialog } from "./game-center/stoppage-time-dialog";

interface GameCenterClientProps {
  preloadedGame: Preloaded<typeof api.games.getById>;
  orgSlug: string;
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
  const endFirstHalf = useMutation(api.gameCenter.endFirstHalf);
  const startSecondHalf = useMutation(api.gameCenter.startSecondHalf);
  const finishMatch = useMutation(api.gameCenter.finishMatch);
  const addStoppageTime = useMutation(api.gameCenter.addStoppageTime);
  const registerBatch = useMutation(api.gameEvents.registerBatch);

  const [activeTeam, setActiveTeam] = useState<CenterTeamKey>("home");
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [selectedEventType, setSelectedEventType] =
    useState<GameEventType | null>(null);
  const [incomingPlayerId, setIncomingPlayerId] = useState("");
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStoppageDialogOpen, setIsStoppageDialogOpen] = useState(false);
  const [stoppageMinutes, setStoppageMinutes] = useState("1");

  const resetEventSelection = useCallback(() => {
    setSelectedSlotId(null);
    setSelectedEventType(null);
    setIncomingPlayerId("");
  }, []);

  useEffect(() => {
    if (game?.matchEndedAt) {
      return;
    }

    setNowMs(Date.now());
    const intervalId = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, [game?.matchEndedAt]);

  useEffect(() => {
    resetEventSelection();
  }, [activeTeam, resetEventSelection]);

  useEffect(() => {
    setSelectedEventType(null);
    setIncomingPlayerId("");
  }, [selectedSlotId]);

  const events = useMemo(
    () => normalizeTimelineEvents(timelineData?.events),
    [timelineData?.events],
  );

  const homeResolved = useMemo(() => {
    if (!lineupData) {
      return null;
    }

    return buildResolvedTeam("home", lineupData.homeTeam, events);
  }, [events, lineupData]);

  const awayResolved = useMemo(() => {
    if (!lineupData) {
      return null;
    }

    return buildResolvedTeam("away", lineupData.awayTeam, events);
  }, [events, lineupData]);

  const activeResolvedTeam =
    activeTeam === "home" ? homeResolved : awayResolved;
  const selectedSlot =
    activeResolvedTeam?.lineup?.slots?.find(
      (slot) => slot.id === selectedSlotId,
    ) ?? null;
  const timing = game
    ? getGameCenterTiming(game, nowMs)
    : {
        matchPhase: "not_started" as const,
        hasStarted: false,
        hasEnded: false,
        canStart: false,
        isLive: false,
        elapsedSeconds: 0,
        liveMinute: 1,
        currentHalfAddedMinutes: 0,
        scheduledDateTime: null,
      };
  const {
    matchPhase,
    hasStarted,
    canStart,
    isLive,
    elapsedSeconds,
    liveMinute,
    currentHalfAddedMinutes,
  } = timing;

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

  useEffect(() => {
    if (!isLive) {
      resetEventSelection();
    }
  }, [isLive, resetEventSelection]);

  if (game === null) {
    return (
      <div className="p-4 md:p-6">
        <Heading>{t("errors.notFound")}</Heading>
      </div>
    );
  }

  const offFieldPlayers = activeResolvedTeam
    ? activeResolvedTeam.roster.filter(
        (player) =>
          !activeResolvedTeam.onFieldPlayerIds.has(String(player._id)),
      )
    : [];

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
      resetEventSelection();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("errors.generic");
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSlotEventPopoverContent = (slot: FootballLineupSlot) => {
    return (
      <GameCenterSlotEventPopoverContent
        player={slot.player}
        liveMinute={liveMinute}
        selectedEventType={selectedEventType}
        incomingPlayerId={incomingPlayerId}
        offFieldPlayers={offFieldPlayers}
        isSubmitting={isSubmitting}
        onSelectEventType={setSelectedEventType}
        onIncomingPlayerChange={setIncomingPlayerId}
        onCancel={resetEventSelection}
        onRegister={handleRegisterEvent}
      />
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

  const handleEndFirstHalf = async () => {
    setIsSubmitting(true);
    try {
      await endFirstHalf({ gameId: game._id as Id<"games"> });
      toast.success(t("games.center.firstHalfEnded"));
      resetEventSelection();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("errors.generic");
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartSecondHalf = async () => {
    setIsSubmitting(true);
    try {
      await startSecondHalf({ gameId: game._id as Id<"games"> });
      toast.success(t("games.center.secondHalfStarted"));
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
      resetEventSelection();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("errors.generic");
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddStoppageTime = async () => {
    const minutes = Number.parseInt(stoppageMinutes, 10);
    if (!Number.isInteger(minutes) || minutes <= 0) {
      toast.error(t("games.center.stoppageInvalid"));
      return;
    }

    setIsSubmitting(true);
    try {
      await addStoppageTime({
        gameId: game._id as Id<"games">,
        minutes,
      });
      toast.success(
        t("games.center.stoppageAdded", {
          minutes,
        }),
      );
      setIsStoppageDialogOpen(false);
      setStoppageMinutes("1");
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
            <GameCenterSummaryPanel
              homeTeamName={game.homeTeamName}
              homeTeamLogo={game.homeTeamLogo}
              awayTeamName={game.awayTeamName}
              awayTeamLogo={game.awayTeamLogo}
              homeScore={game.homeScore ?? 0}
              awayScore={game.awayScore ?? 0}
              elapsedSeconds={elapsedSeconds}
              matchPhase={matchPhase}
              liveMinute={liveMinute}
              currentHalfAddedMinutes={currentHalfAddedMinutes}
              hasStarted={hasStarted}
              canStart={canStart}
              isSubmitting={isSubmitting}
              onStartMatch={handleStartMatch}
              onOpenStoppageDialog={() => setIsStoppageDialogOpen(true)}
              onEndFirstHalf={handleEndFirstHalf}
              onStartSecondHalf={handleStartSecondHalf}
              onFinishMatch={handleFinishMatch}
            />
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
              <GameCenterLiveFieldPanel
                isLoading={lineupData === undefined}
                homeResolved={homeResolved}
                awayResolved={awayResolved}
                activeTeam={activeTeam}
                onActiveTeamChange={setActiveTeam}
                selectedSlotId={selectedSlotId}
                isLive={isLive}
                onSlotPopoverOpenChange={(slotId, open) =>
                  setSelectedSlotId(open ? slotId : null)
                }
                renderSlotPopoverContent={renderSlotEventPopoverContent}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <StoppageTimeDialog
        open={isStoppageDialogOpen}
        onOpenChange={setIsStoppageDialogOpen}
        minutes={stoppageMinutes}
        onMinutesChange={setStoppageMinutes}
        isSubmitting={isSubmitting}
        onSave={handleAddStoppageTime}
      />
    </div>
  );
}
