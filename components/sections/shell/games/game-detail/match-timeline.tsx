"use client";

import { useMemo, useState } from "react";
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
  | "substitution"
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

function getEventRatio(minute: number | string, totalMinutes: number) {
  const numericMinute = parseMinuteValue(minute);
  const clampedMinute = Math.max(0, Math.min(numericMinute, totalMinutes));
  return totalMinutes <= 0
    ? 0
    : Math.max(0, Math.min(1, clampedMinute / totalMinutes));
}

function getEventPosition(minute: number | string, totalMinutes: number) {
  return `${getEventRatio(minute, totalMinutes) * 100}%`;
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
    case "substitution":
      return (
        <span className="text-[15px] leading-none font-semibold text-foreground">
          ↕
        </span>
      );
    case "penalty_missed":
      return <span className="text-[13px] leading-none font-bold">P</span>;
    default:
      return null;
  }
}

function buildEventDescription(
  t: (key: string) => string,
  event: MatchTimelineEvent,
) {
  switch (event.type) {
    case "goal":
      return event.primaryText
        ? `${event.primaryText}`
        : t("games.events.typeOptions.goal");
    case "yellow_card":
      return event.primaryText
        ? `${event.primaryText}`
        : t("games.events.typeOptions.yellow_card");
    case "red_card":
      return event.primaryText
        ? `${event.primaryText}`
        : t("games.events.typeOptions.red_card");
    case "substitution":
      return event.secondaryText
        ? `${event.primaryText ?? ""} ↔ ${event.secondaryText}`.trim()
        : (event.primaryText ?? t("games.events.typeOptions.substitution"));
    case "penalty_scored":
      return event.primaryText ?? t("games.events.typeOptions.penalty_scored");
    case "penalty_missed":
      return event.primaryText ?? t("games.events.typeOptions.penalty_missed");
    default:
      return event.primaryText ?? t("games.events.register");
  }
}

type MatchTimelineEventGroup = {
  key: string;
  side: MatchTimelineSide;
  minuteLabel: string;
  minuteValue: number;
  events: MatchTimelineEvent[];
};

function groupEventsByMinute(events: MatchTimelineEvent[]) {
  const groups = new Map<string, MatchTimelineEventGroup>();

  for (const event of events) {
    const minuteLabel = formatMinuteLabel(event.minute);
    const key = `${event.side}:${minuteLabel}`;

    if (!groups.has(key)) {
      groups.set(key, {
        key,
        side: event.side,
        minuteLabel,
        minuteValue: parseMinuteValue(event.minute),
        events: [],
      });
    }

    groups.get(key)!.events.push(event);
  }

  return Array.from(groups.values()).sort((left, right) => {
    if (left.minuteValue !== right.minuteValue) {
      return left.minuteValue - right.minuteValue;
    }

    return left.side.localeCompare(right.side);
  });
}

function getTooltipAlignment(ratio: number) {
  if (ratio <= 0.18) {
    return "start";
  }
  if (ratio >= 0.82) {
    return "end";
  }
  return "center";
}

function EventCluster({
  group,
  totalMinutes,
  placement,
  active,
  onActivate,
  onDeactivate,
  onToggle,
  t,
}: {
  group: MatchTimelineEventGroup;
  totalMinutes: number;
  placement: "top" | "bottom";
  active: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
  onToggle: () => void;
  t: (key: string) => string;
}) {
  const clusterWidth = active
    ? Math.max(28, 28 + (group.events.length - 1) * 22)
    : 28;
  const ratio = getEventRatio(group.minuteLabel, totalMinutes);
  const alignment = getTooltipAlignment(ratio);

  return (
    <Tooltip open={active}>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "absolute z-20 -translate-x-1/2 outline-none",
            placement === "top" ? "top-0" : "bottom-0",
          )}
          style={{
            left: getEventPosition(group.minuteLabel, totalMinutes),
            width: clusterWidth,
          }}
          onMouseEnter={onActivate}
          onMouseLeave={onDeactivate}
          onClick={onToggle}
          aria-label={`${group.minuteLabel}' ${group.events
            .map((event) => buildEventDescription(t, event))
            .join(", ")}`}
        >
          <div className="relative h-8 w-full">
            {group.events.map((event, index) => {
              const expandedOffset =
                (index - (group.events.length - 1) / 2) * 22;

              return (
                <span
                  key={event.id}
                  className="absolute top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full transition-transform duration-200 ease-out"
                  style={{
                    left: "50%",
                    transform: active
                      ? `translate(calc(-50% + ${expandedOffset}px), -50%)`
                      : "translate(-50%, -50%)",
                    zIndex: active ? group.events.length - index : index + 1,
                  }}
                >
                  {getEventIcon(event.type)}
                </span>
              );
            })}
          </div>
        </button>
      </TooltipTrigger>
      <TooltipContent
        side={placement}
        align={alignment}
        sideOffset={8}
        className="w-44 px-3 py-2"
      >
        <div className="text-xs font-semibold">{group.minuteLabel}'</div>
        <div className="mt-1.5 space-y-1">
          {group.events.map((event) => (
            <div key={event.id} className="flex items-start gap-2 text-xs">
              <span className="mt-0.5 shrink-0">
                {getEventIcon(event.type)}
              </span>
              <span className="leading-relaxed text-background/80 dark:text-muted-foreground">
                {buildEventDescription(t, event)}
              </span>
            </div>
          ))}
        </div>
      </TooltipContent>
    </Tooltip>
  );
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
  const [hoveredGroupKey, setHoveredGroupKey] = useState<string | null>(null);
  const [pinnedGroupKey, setPinnedGroupKey] = useState<string | null>(null);
  const events = timelineData?.events ?? [];
  const canManageEvents = timelineData?.canManageEvents ?? false;

  const totalMinutes = Math.max(
    90,
    ...events.map((event) => parseMinuteValue(event.minute)),
  );

  const groupedEvents = useMemo(() => groupEventsByMinute(events), [events]);

  const distinctMinuteLabels = Array.from(
    new Set(events.map((event) => formatMinuteLabel(event.minute))),
  ).sort((left, right) => parseMinuteValue(left) - parseMinuteValue(right));

  const homeGroups = groupedEvents.filter((group) => group.side === "home");
  const awayGroups = groupedEvents.filter((group) => group.side === "away");

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
                {homeGroups.map((group) => (
                  <EventCluster
                    key={group.key}
                    group={group}
                    totalMinutes={totalMinutes}
                    placement="top"
                    active={
                      pinnedGroupKey === group.key ||
                      (pinnedGroupKey === null && hoveredGroupKey === group.key)
                    }
                    onActivate={() => {
                      if (pinnedGroupKey === null) {
                        setHoveredGroupKey(group.key);
                      }
                    }}
                    onDeactivate={() => {
                      if (pinnedGroupKey === null) {
                        setHoveredGroupKey(null);
                      }
                    }}
                    onToggle={() =>
                      setPinnedGroupKey((current) =>
                        current === group.key ? null : group.key,
                      )
                    }
                    t={t}
                  />
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

              <div className="absolute inset-x-0 top-[58px] h-8 sm:top-[74px]">
                {awayGroups.map((group) => (
                  <EventCluster
                    key={group.key}
                    group={group}
                    totalMinutes={totalMinutes}
                    placement="bottom"
                    active={
                      pinnedGroupKey === group.key ||
                      (pinnedGroupKey === null && hoveredGroupKey === group.key)
                    }
                    onActivate={() => {
                      if (pinnedGroupKey === null) {
                        setHoveredGroupKey(group.key);
                      }
                    }}
                    onDeactivate={() => {
                      if (pinnedGroupKey === null) {
                        setHoveredGroupKey(null);
                      }
                    }}
                    onToggle={() =>
                      setPinnedGroupKey((current) =>
                        current === group.key ? null : group.key,
                      )
                    }
                    t={t}
                  />
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
