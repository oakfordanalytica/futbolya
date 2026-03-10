"use client";

import { useState } from "react";
import Image from "next/image";
import { useQuery } from "convex/react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { GameEventDialog } from "./game-event-dialog";

type MatchTimelineSide = "home" | "away";

type MatchTimelineEventType =
  | "goal"
  | "yellow_card"
  | "red_card"
  | "penalty_scored"
  | "penalty_missed";

export interface MatchTimelineEvent {
  id: string;
  side: MatchTimelineSide;
  type: MatchTimelineEventType;
  minute: number | string;
  primaryText?: string;
  secondaryText?: string;
}

interface MatchTimelineTeam {
  name: string;
  logoUrl?: string;
}

interface MatchTimelineProps {
  gameId: string;
  title?: string;
  homeTeam: MatchTimelineTeam;
  awayTeam: MatchTimelineTeam;
  className?: string;
}

function parseMinuteValue(minute: number | string): number {
  if (typeof minute === "number") {
    return minute;
  }

  const normalized = minute.replace(/'/g, "").trim();
  const [base, extra] = normalized.split("+");
  const baseMinute = Number.parseInt(base, 10) || 0;
  const extraMinute = Number.parseInt(extra ?? "0", 10) || 0;
  return baseMinute + extraMinute;
}

function formatMinuteLabel(minute: number | string): string {
  if (typeof minute === "number") {
    return `${minute}`;
  }

  return minute.replace(/'/g, "").trim();
}

function getEventPosition(minute: number | string, totalMinutes: number) {
  const numericMinute = parseMinuteValue(minute);
  const clampedMinute = Math.max(0, Math.min(numericMinute, totalMinutes));
  const ratio = totalMinutes <= 0 ? 0 : clampedMinute / totalMinutes;
  return `${Math.max(0, Math.min(100, ratio * 100))}%`;
}

function getEventIcon(type: MatchTimelineEventType) {
  switch (type) {
    case "goal":
    case "penalty_scored":
      return <span className="text-[18px] leading-none">⚽</span>;
    case "yellow_card":
      return <span className="block h-4 w-3 rounded-[2px] bg-yellow-400" />;
    case "red_card":
      return <span className="block h-4 w-3 rounded-[2px] bg-red-500" />;
    case "penalty_missed":
      return <span className="text-[13px] leading-none font-bold">P</span>;
    default:
      return null;
  }
}

function buildTooltipDescription(
  t: (key: string) => string,
  event: MatchTimelineEvent,
) {
  if (event.secondaryText) {
    return event.secondaryText;
  }

  switch (event.type) {
    case "goal":
      return event.primaryText ?? t("games.events.typeOptions.goal");
    case "yellow_card":
      return event.primaryText ?? t("games.events.typeOptions.yellow_card");
    case "red_card":
      return event.primaryText ?? t("games.events.typeOptions.red_card");
    case "penalty_scored":
      return event.primaryText ?? t("games.events.typeOptions.penalty_scored");
    case "penalty_missed":
      return event.primaryText ?? t("games.events.typeOptions.penalty_missed");
    default:
      return event.primaryText ?? t("games.events.register");
  }
}

function TeamRow({ team }: { team: MatchTimelineTeam }) {
  return (
    <div className="flex items-center gap-2">
      {team.logoUrl ? (
        <Image
          src={team.logoUrl}
          alt={team.name}
          width={20}
          height={20}
          className="size-5 object-contain"
        />
      ) : (
        <div className="flex size-5 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
          {team.name.charAt(0).toUpperCase()}
        </div>
      )}
      <span className="text-sm font-medium">{team.name}</span>
    </div>
  );
}

export function MatchTimeline({
  gameId,
  title,
  homeTeam,
  awayTeam,
  className,
}: MatchTimelineProps) {
  const t = useTranslations("Common");
  const resolvedTitle = title ?? t("games.summarySections.timeline");
  const timelineData = useQuery(api.gameEvents.getByGameId, {
    gameId: gameId as Id<"games">,
  });
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const events = timelineData?.events ?? [];
  const canManageEvents = timelineData?.canManageEvents ?? false;

  const totalMinutes = Math.max(
    90,
    ...events.map((event) => parseMinuteValue(event.minute)),
  );

  const distinctMinuteLabels = Array.from(
    new Set(events.map((event) => formatMinuteLabel(event.minute))),
  ).sort((left, right) => parseMinuteValue(left) - parseMinuteValue(right));

  const homeEvents = events.filter((event) => event.side === "home");
  const awayEvents = events.filter((event) => event.side === "away");

  return (
    <>
      <Card
        className={cn("gap-0 overflow-hidden rounded-xl pt-2 pb-0", className)}
      >
        <CardHeader className="grid-rows-[auto] gap-0 border-b px-3 pt-0 pb-2 md:px-5 [.border-b]:pb-2">
          <CardTitle className="text-lg tracking-tight">
            {resolvedTitle}
          </CardTitle>
          {canManageEvents && (
            <CardAction className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2.5 text-xs"
                onClick={() => setIsEventDialogOpen(true)}
              >
                <span className="sm:hidden">
                  {t("games.events.registerShort")}
                </span>
                <span className="hidden sm:inline">
                  {t("games.events.register")}
                </span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2.5 text-xs"
                onClick={() => toast(t("games.events.matchCenterSoon"))}
              >
                <span className="sm:hidden">
                  {t("games.events.matchCenterShort")}
                </span>
                <span className="hidden sm:inline">
                  {t("games.events.matchCenter")}
                </span>
              </Button>
            </CardAction>
          )}
        </CardHeader>

        <CardContent className="px-3 py-3 pt-2 md:px-5 md:py-5 md:pt-3">
          <div className="space-y-4">
            <TeamRow team={homeTeam} />

            <div className="relative h-24 sm:h-28">
              <div className="absolute inset-x-0 top-[18px] h-8">
                {homeEvents.map((event) => (
                  <Tooltip key={event.id}>
                    <TooltipTrigger asChild>
                      <div
                        className="absolute top-0 -translate-x-1/2"
                        style={{
                          left: getEventPosition(event.minute, totalMinutes),
                        }}
                      >
                        <div className="flex flex-col items-center gap-1">
                          {getEventIcon(event.type)}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={6}>
                      <p className="font-semibold">
                        {formatMinuteLabel(event.minute)}'
                      </p>
                      <p className="text-muted-foreground">
                        {buildTooltipDescription(t, event)}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>

              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2">
                <div className="relative h-4 rounded-full bg-green-600">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-white">
                    I
                  </span>
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-100 px-1.5 text-[10px] font-semibold text-green-700">
                    MT
                  </span>
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-white">
                    F
                  </span>

                  {distinctMinuteLabels.map((minuteLabel) => (
                    <span
                      key={minuteLabel}
                      className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-medium text-white/95"
                      style={{
                        left: getEventPosition(minuteLabel, totalMinutes),
                      }}
                    >
                      {minuteLabel}
                    </span>
                  ))}
                </div>
              </div>

              <div className="absolute inset-x-0 bottom-[4px] h-8">
                {awayEvents.map((event) => (
                  <Tooltip key={event.id}>
                    <TooltipTrigger asChild>
                      <div
                        className="absolute bottom-0 -translate-x-1/2"
                        style={{
                          left: getEventPosition(event.minute, totalMinutes),
                        }}
                      >
                        <div className="flex flex-col items-center gap-1">
                          {getEventIcon(event.type)}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" sideOffset={6}>
                      <p className="font-semibold">
                        {formatMinuteLabel(event.minute)}'
                      </p>
                      <p className="text-muted-foreground">
                        {buildTooltipDescription(t, event)}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>

            <TeamRow team={awayTeam} />
          </div>
        </CardContent>
      </Card>

      <GameEventDialog
        open={isEventDialogOpen}
        onOpenChange={setIsEventDialogOpen}
        gameId={gameId}
      />
    </>
  );
}
