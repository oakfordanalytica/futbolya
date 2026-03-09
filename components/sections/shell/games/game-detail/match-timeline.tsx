"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

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
  title?: string;
  homeTeam: MatchTimelineTeam;
  awayTeam: MatchTimelineTeam;
  events: MatchTimelineEvent[];
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

function buildTooltipDescription(event: MatchTimelineEvent) {
  if (event.secondaryText) {
    return event.secondaryText;
  }

  switch (event.type) {
    case "goal":
      return event.primaryText ?? "Gol";
    case "yellow_card":
      return event.primaryText ?? "Tarjeta amarilla";
    case "red_card":
      return event.primaryText ?? "Tarjeta roja";
    case "substitution":
      return event.primaryText ?? "Sustitución";
    case "penalty_scored":
      return event.primaryText ?? "Penal convertido";
    case "penalty_missed":
      return event.primaryText ?? "Penal fallado";
    default:
      return event.primaryText ?? "Evento";
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
  title,
  homeTeam,
  awayTeam,
  events,
  className,
}: MatchTimelineProps) {
  const t = useTranslations("Common");
  const resolvedTitle = title ?? t("games.summarySections.timeline");

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
    <section className={cn("rounded-xl border bg-card p-4 md:p-5", className)}>
      <div className="space-y-3">
        <h3 className="text-lg font-semibold tracking-tight">
          {resolvedTitle}
        </h3>
        <Separator className="border-dashed" />
      </div>

      <div className="mt-5 space-y-4">
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
                    {buildTooltipDescription(event)}
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
                    {buildTooltipDescription(event)}
                  </p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>

        <TeamRow team={awayTeam} />
      </div>
    </section>
  );
}
